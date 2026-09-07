package service

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
)

// Caller is the authenticated user driving a request. Services read it from
// the context to enforce privacy isolation on read paths.
type Caller struct {
	UserID string
	Role   string
}

type callerCtxKey struct{}

// WithCaller attaches the authenticated caller to a request context.
func WithCaller(ctx context.Context, c *Caller) context.Context {
	return context.WithValue(ctx, callerCtxKey{}, c)
}

// CallerFrom returns the caller attached to ctx, or nil when absent.
func CallerFrom(ctx context.Context) *Caller {
	c, _ := ctx.Value(callerCtxKey{}).(*Caller)
	return c
}

func callerID(ctx context.Context) string {
	if c := CallerFrom(ctx); c != nil {
		return c.UserID
	}
	return ""
}

type rowQuerier interface {
	QueryContext(ctx context.Context, query string, args ...any) (*sql.Rows, error)
}

// itemPrivacy appends "alias.is_private = 0 OR alias.owner_id = ?": private
// rows are visible only to their owner. Everyone else — including the owner
// role — sees shared rows and their own private rows, per the product design's
// "仅创建者/所有者可见，对其他成员（包括管理员）彻底隐去" rule.
func itemPrivacy(alias, owner string, where string, args []any) (string, []any) {
	where += fmt.Sprintf(" AND (%s.is_private = 0 OR %s.owner_id = ?)", alias, alias)
	args = append(args, owner)
	return where, args
}

// visibleLocationIDs returns the set of location ids the caller may see. A
// location is visible only when the node itself and every ancestor are public
// or owned by the caller: a private node hides its whole subtree (inheritance).
// An absent caller sees only fully public locations.
func visibleLocationIDs(ctx context.Context, q rowQuerier, owner string) (map[string]bool, error) {
	rows, err := q.QueryContext(ctx, `
		SELECT id, parent_id, is_private, owner_id FROM locations`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	type loc struct {
		parent  *string
		private bool
		owner   *string
	}
	locs := map[string]loc{}
	for rows.Next() {
		var id string
		var parent *string
		var private int
		var ownerID *string
		if err := rows.Scan(&id, &parent, &private, &ownerID); err != nil {
			return nil, err
		}
		locs[id] = loc{parent: parent, private: private != 0, owner: ownerID}
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	visible := map[string]bool{}
	var check func(id string) bool
	check = func(id string) bool {
		if v, ok := visible[id]; ok {
			return v
		}
		l, ok := locs[id]
		if !ok {
			return false
		}
		v := !l.private || (l.owner != nil && *l.owner == owner)
		if v && l.parent != nil {
			v = check(*l.parent)
		}
		visible[id] = v
		return v
	}
	for id := range locs {
		check(id)
	}
	return visible, nil
}

// locationClause restricts items to the visible location set. Items without a
// location stay visible; items in a hidden (private) location are filtered out.
func locationClause(alias string, visible map[string]bool, where string, args []any) (string, []any) {
	ids := make([]string, 0, len(visible))
	for id, ok := range visible {
		if ok {
			ids = append(ids, id)
		}
	}
	if len(ids) == 0 {
		return where + fmt.Sprintf(" AND %s.location_id IS NULL", alias), args
	}
	placeholders := strings.TrimSuffix(strings.Repeat("?,", len(ids)), ",")
	where += fmt.Sprintf(" AND (%s.location_id IS NULL OR %s.location_id IN (%s))", alias, alias, placeholders)
	for _, id := range ids {
		args = append(args, id)
	}
	return where, args
}

// applyItemPrivacy adds the full item visibility rule (own privacy + location
// inheritance) to a WHERE built for the items table, reading the caller from
// ctx. alias names the items table in the query.
func applyItemPrivacy(ctx context.Context, q rowQuerier, alias string, where string, args []any) (string, []any, error) {
	owner := callerID(ctx)
	where, args = itemPrivacy(alias, owner, where, args)
	visible, err := visibleLocationIDs(ctx, q, owner)
	if err != nil {
		return where, args, err
	}
	where, args = locationClause(alias, visible, where, args)
	return where, args, nil
}

// applyLocationPrivacy restricts a locations read to nodes visible to the
// caller, honoring inheritance.
func applyLocationPrivacy(ctx context.Context, q rowQuerier, where string, args []any) (string, []any, error) {
	visible, err := visibleLocationIDs(ctx, q, callerID(ctx))
	if err != nil {
		return where, args, err
	}
	ids := make([]string, 0, len(visible))
	for id, ok := range visible {
		if ok {
			ids = append(ids, id)
		}
	}
	if len(ids) == 0 {
		return where + " AND 1 = 0", args, nil
	}
	placeholders := strings.TrimSuffix(strings.Repeat("?,", len(ids)), ",")
	where += fmt.Sprintf(" AND id IN (%s)", placeholders)
	for _, id := range ids {
		args = append(args, id)
	}
	return where, args, nil
}
