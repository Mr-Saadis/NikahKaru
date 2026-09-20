interface MatchingTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function MatchingTabs({ activeTab, onTabChange }: MatchingTabsProps) {
  const tabs = [
    { id: "potential", label: "Potential Matches" },
    { id: "details", label: "Match Details" },
    { id: "history", label: "Matching History" }
  ];

  return (
    <div className="flex border-b border-gray-200">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-6 py-4 text-[13px] font-semibold transition-all relative ${
              isActive ? "text-brand-green" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {tab.label}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-green rounded-t-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
