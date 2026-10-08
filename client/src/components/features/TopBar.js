import React from 'react';
import { ArrowLeft, Users, Share, Moon, Sun, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import NotificationMenu from '../ui/NotificationMenu';
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from '../ui/Dropdown';
import './TopBar.css';

const TopBar = ({ projectName = 'Untitled Project' }) => {
  const navigate = useNavigate();

  const handleThemeChange = (theme, e) => {
    import('../../lib/theme').then(({ applyTheme }) => {
      applyTheme(theme, e);
    });
  };

  return (
    <header className="app-topbar chrome-panel">
      <div className="topbar-left">
        <Button variant="ghost" size="small" iconOnly onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} />
        </Button>
        <div className="topbar-project-name">{projectName}</div>
      </div>
      
      <div className="topbar-center">
        {/* Placeholder for center content like search or command palette trigger */}
      </div>

      <div className="topbar-right">
        <NotificationMenu />
        <div className="topbar-avatars">
          <div className="avatar" style={{ backgroundColor: 'var(--colab-1)' }}>P</div>
          <div className="avatar" style={{ backgroundColor: 'var(--colab-2)' }}>A</div>
        </div>
        <Button variant="secondary" size="small">
          <Share size={14} style={{ marginRight: '6px' }} />
          Share
        </Button>
        <Dropdown>
          <DropdownTrigger asChild>
            <Button variant="ghost" size="small" iconOnly>
              <Monitor size={16} />
            </Button>
          </DropdownTrigger>
          <DropdownContent align="end">
            <DropdownItem onClick={(e) => handleThemeChange('light', e)}>
              <Sun size={14} /> Light
            </DropdownItem>
            <DropdownItem onClick={(e) => handleThemeChange('dark', e)}>
              <Moon size={14} /> Dark
            </DropdownItem>
            <DropdownItem onClick={(e) => handleThemeChange('system', e)}>
              <Monitor size={14} /> System
            </DropdownItem>
          </DropdownContent>
        </Dropdown>
      </div>
    </header>
  );
};

export default TopBar;
