import React from 'react';
import { Files, Search, GitBranch, Users, MessageSquare, Settings } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import './ActivityBar.css';

const ActivityBar = ({ activePanel, onPanelChange }) => {
  const topIcons = [
    { id: 'explorer', icon: Files, label: 'Explorer' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'source', icon: GitBranch, label: 'Source Control' },
    { id: 'participants', icon: Users, label: 'Participants' },
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
  ];

  const bottomIcons = [
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  const renderIcon = ({ id, icon: Icon, label }) => (
    <div
      key={id}
      className={clsx('activity-bar-icon', activePanel === id && 'active')}
      onClick={() => onPanelChange(id)}
      title={label}
      style={{ position: 'relative' }}
    >
      {activePanel === id && (
        <motion.div
          layoutId="activity-bar-indicator"
          className="activity-indicator"
          initial={false}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '2px',
            backgroundColor: 'var(--accent)',
            borderRadius: '0 2px 2px 0'
          }}
        />
      )}
      <Icon size={20} strokeWidth={1.5} />
    </div>
  );

  return (
    <aside className="app-activity-bar chrome-panel">
      <div className="activity-bar-top">
        {topIcons.map(renderIcon)}
      </div>
      <div className="activity-bar-bottom">
        {bottomIcons.map(renderIcon)}
      </div>
    </aside>
  );
};

export default ActivityBar;
