import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { IconCheck, IconInfoCircle } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import {
  Stack,
  StackTight,
  uiStyles,
} from '../components/ui';
import { Alert } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { TextField } from '../components/ui/text-field';
import { useToast } from '../components/ui/use-toast';
import { formatToday } from '../layouts/nav-data';
import { authApi, setToken } from '../api/client';
import * as s from './-login.css';

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: LoginPage,
});

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/*
 * 程序化生成的粒子场数据。坐标取 SVG user unit（浮墨层 viewBox 1000×700，
 * 以 slice 等比铺满视口；x 收在 260–740、y 收在 60–640，保证窄屏裁切后仍留得住粒子）。
 */
type DustTone = 'ink' | 'seal';

const DUST: Array<{
  cx: number;
  cy: number;
  r: number;
  dur: number;
  off: number;
  tone: DustTone;
}> = [
  { cx: 318, cy: 92, r: 1.05, dur: 26, off: 4, tone: 'ink' },
  { cx: 428, cy: 148, r: 0.72, dur: 33, off: 17, tone: 'ink' },
  { cx: 612, cy: 118, r: 1.35, dur: 22, off: 9, tone: 'seal' },
  { cx: 704, cy: 176, r: 0.88, dur: 29, off: 24, tone: 'ink' },
  { cx: 356, cy: 246, r: 0.6, dur: 35, off: 11, tone: 'ink' },
  { cx: 522, cy: 214, r: 1.12, dur: 24, off: 2, tone: 'ink' },
  { cx: 668, cy: 286, r: 0.78, dur: 31, off: 20, tone: 'seal' },
  { cx: 402, cy: 330, r: 1.45, dur: 27, off: 28, tone: 'ink' },
  { cx: 596, cy: 372, r: 0.66, dur: 34, off: 6, tone: 'ink' },
  { cx: 286, cy: 404, r: 0.95, dur: 23, off: 15, tone: 'seal' },
  { cx: 470, cy: 438, r: 1.2, dur: 30, off: 22, tone: 'ink' },
  { cx: 728, cy: 466, r: 0.7, dur: 36, off: 12, tone: 'ink' },
  { cx: 372, cy: 512, r: 1.6, dur: 25, off: 1, tone: 'seal' },
  { cx: 546, cy: 494, r: 0.82, dur: 32, off: 26, tone: 'ink' },
  { cx: 646, cy: 548, r: 1.0, dur: 28, off: 8, tone: 'ink' },
  { cx: 302, cy: 584, r: 0.62, dur: 34, off: 19, tone: 'ink' },
  { cx: 436, cy: 596, r: 1.28, dur: 21, off: 13, tone: 'ink' },
  { cx: 690, cy: 622, r: 0.9, dur: 30, off: 30, tone: 'seal' },
  { cx: 268, cy: 178, r: 0.68, dur: 33, off: 7, tone: 'ink' },
  { cx: 742, cy: 268, r: 1.08, dur: 26, off: 21, tone: 'ink' },
  { cx: 336, cy: 452, r: 0.74, dur: 31, off: 5, tone: 'seal' },
  { cx: 620, cy: 208, r: 1.5, dur: 23, off: 16, tone: 'ink' },
  { cx: 498, cy: 306, r: 0.64, dur: 35, off: 29, tone: 'ink' },
  { cx: 706, cy: 388, r: 1.16, dur: 27, off: 3, tone: 'ink' },
];

/** 盖章瞬间的印泥飞溅：22 道射线，角度、缩距、粒径、时长各有些微差异。 */
const SPLASH_RAYS = Array.from({ length: 22 }, (_, i) => ({
  angle: 10 + i * (360 / 22),
  scale: [1, 0.78, 1.15, 0.88, 1.05, 0.72][i % 6],
  r: [0.7, 1.15, 0.55, 0.9][i % 4],
  dur: [400, 340, 460][i % 3],
  delay: (i % 6) * 10,
  tone: (i % 7 === 3 ? 'ink' : 'seal') as DustTone,
}));

/** 册页流水号 = 今天是今年的第几页 */
function folioOfToday() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000);
}

/** 数字翻牌：从稍低的数字递增到目标，纯展示用。 */
function useCountUp(target: number, durationMs: number) {
  const from = Math.max(1, target - 46);
  const [value, setValue] = useState(() =>
    prefersReducedMotion() ? target : from,
  );
  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    const startedAt = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - startedAt) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);
  return value;
}

/**
 * 光标视差：把归一化坐标写进背景层的 --px/--py，各层按自己的深度系数换算位移。
 * 只在非触控、未要求减弱动效时启用。
 */
function useParallax(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (typeof window.matchMedia !== 'function') return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const nx = (e.clientX / window.innerWidth) * 2 - 1;
        const ny = (e.clientY / window.innerHeight) * 2 - 1;
        el.style.setProperty('--px', nx.toFixed(3));
        el.style.setProperty('--py', ny.toFixed(3));
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
    };
  }, [ref]);
}

function LoginPage() {
  const { t } = useTranslation();
  const { systemStatus } = Route.useRouteContext();
  const { redirect } = Route.useSearch();
  const nav = useNavigate();
  const toast = useToast();
  const isDemo = systemStatus.mode === 'demo';

  const [username, setUsername] = useState(isDemo ? 'admin@havit.local' : '');
  const [password, setPassword] = useState(isDemo ? 'havit-demo' : '');
  const [sealed, setSealed] = useState(false);
  const [rejected, setRejected] = useState(false);

  const backdropRef = useRef<HTMLDivElement>(null);
  useParallax(backdropRef);
  const folioValue = useCountUp(folioOfToday(), 950);

  const login = useMutation({
    mutationFn: () => authApi.login({ username, password }),
    onSuccess: async (data) => {
      setToken(data.token);
      // 留一瞬给「盖章」：先压印、印泥飞溅，再进入台账。
      if (!prefersReducedMotion()) {
        setSealed(true);
        await new Promise((resolve) => setTimeout(resolve, 520));
      }
      nav({ to: redirect ?? '/' });
    },
    onError: () => {
      setRejected(true);
      window.setTimeout(() => setRejected(false), 520);
      toast.show(t('auth.loginFailed'));
    },
  });

  function handleSubmit() {
    setRejected(false);
    login.mutate();
  }

  const stampClass = sealed
    ? s.stampSealed
    : login.isPending
      ? s.stampPending
      : rejected
        ? s.stampShake
        : undefined;

  return (
    <main className={[uiStyles.center, 'auth-screen', s.screen].join(' ')}>
      <div className={s.backdrop} aria-hidden ref={backdropRef}>
        {/* 视差最深的一层墨色 */}
        <span className={s.plWash}>
          <span className={s.backdropWash} />
        </span>
        <span className={s.backdropRules} />
        <span className={s.backdropMargin} />
        <span className={s.backdropMarginRight} />
        <span className={s.backdropGrain} />
        {/* 浮墨：纸上缓缓上浮的墨点与朱砂点 */}
        <svg
          className={s.dustField}
          viewBox="0 0 1000 700"
          preserveAspectRatio="xMidYMid slice"
        >
          {DUST.map((d, i) => (
            <circle
              key={i}
              className={d.tone === 'seal' ? s.dustSeal : s.dustInk}
              cx={d.cx}
              cy={d.cy}
              r={d.r}
              style={{
                animationDuration: `${d.dur}s`,
                animationDelay: `-${d.off}s`,
              }}
            />
          ))}
        </svg>
      </div>

      <div className={s.cardStack}>
        {/* 垫在底下的两页账页，只露出错开的边缘 */}
        <span className={s.stackSheetBack} aria-hidden />
        <span className={s.stackSheetMid} aria-hidden />

        <Card
          className={`auth-card ${s.card}${rejected ? ` ${s.cardError}` : ''}`}
          padded
        >
          {/* 册页流水号：今天是今年的第几页 */}
          <span className={s.folio} aria-hidden>
            No.&nbsp;
            <span className={s.folioNum}>{folioValue}</span>
          </span>

          <Stack>
          <StackTight className={uiStyles.textCenter}>
            <span className={`${s.sealMark} ${s.rise.r1}`} aria-hidden>
              H
            </span>
            <h1 className={`${uiStyles.heading} page-heading ${s.rise.r2}`}>
              {t('auth.login')} Havit
            </h1>
            <p className={`${uiStyles.muted} page-kicker ${s.rise.r3}`}>
              {t('auth.loginSubtitle')}
            </p>
            <span className={`${s.entryRule} ${s.rise.r4}`} aria-hidden>
              <span className={s.entryRuleLine} />
              <span className={s.entryRuleLabel}>
                {t('auth.ledgerEntry')} · {formatToday(t)}
              </span>
              <span className={s.entryRuleLine} />
            </span>
          </StackTight>

          {isDemo && (
            <div className={s.rise.r5}>
              <Alert icon={<IconInfoCircle size={18} />}>
                {t('auth.demoHint')}
              </Alert>
            </div>
          )}

          <div className={`${s.fieldRule} ${s.rise.r6}`}>
            <TextField
              label={t('auth.username')}
              value={username}
              onChange={(e) => setUsername(e.currentTarget.value)}
              required
            />
          </div>
          <div className={`${s.fieldRule} ${s.rise.r7}`}>
            <TextField
              label={t('auth.password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              required
            />
          </div>

          <div className={`${s.actionRow} ${s.rise.r8}`}>
            <Button
              className={`${s.stampButton}${stampClass ? ` ${stampClass}` : ''}`}
              disabled={!username || !password || login.isPending || sealed}
              onClick={handleSubmit}
            >
              <span className={s.stampLabel}>
                {sealed && <IconCheck size={16} />}
                {sealed
                  ? t('auth.sealed')
                  : login.isPending
                    ? t('auth.loggingIn')
                    : t('auth.login')}
              </span>
            </Button>
            {/* 盖章那一瞬的印泥飞溅（只在成功回执期间挂载，动画自然只跑一次） */}
            {sealed && (
              <svg className={s.splash} viewBox="-50 -50 100 100" aria-hidden>
                <circle className={s.splashRing} r={11} />
                {SPLASH_RAYS.map((ray, i) => (
                  <g key={i} transform={`rotate(${ray.angle}) scale(${ray.scale})`}>
                    <circle
                      className={ray.tone === 'ink' ? s.splashDropInk : s.splashDrop}
                      r={ray.r}
                      style={{
                        animationDuration: `${ray.dur}ms`,
                        animationDelay: `${ray.delay}ms`,
                      }}
                    />
                  </g>
                ))}
              </svg>
            )}
          </div>
        </Stack>
        </Card>
      </div>
    </main>
  );
}
