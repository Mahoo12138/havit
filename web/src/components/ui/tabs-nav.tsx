import { Tabs, TabsList, TabsTrigger } from './tabs';

type TabsNavItem = {
  key: string;
  label: string;
};

function TabsNav({
  value,
  onChange,
  tabs,
}: {
  value: string;
  onChange: (value: string) => void;
  tabs: TabsNavItem[];
}) {
  return (
    <Tabs value={value} onValueChange={onChange}>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.key} value={tab.key}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

export { TabsNav };
export type { TabsNavItem };
