import React from 'react';
import { Wifi, XCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import './StatusBar.css';

const StatusBar = ({ connectionStatus = 'connected', cursor = { line: 1, col: 1 }, colabCount = 1 }) => {
  return (
    <footer className="app-status-bar chrome-panel">
      <div className="status-bar-left">
        <div className={clsx('status-item', `status-${connectionStatus}`)}>
          {connectionStatus === 'connected' && <CheckCircle2 size={12} />}
          {connectionStatus === 'reconnecting' && <AlertCircle size={12} />}
          {connectionStatus === 'offline' && <XCircle size={12} />}
          <span>{connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}</span>
        </div>
        <div className="status-item">
          <Wifi size={12} />
          <span>Synced</span>
        </div>
      </div>

      <div className="status-bar-right">
        <div className="status-item tabular-nums">
          Ln {cursor.line}, Col {cursor.col}
        </div>
        <div className="status-item">
          Spaces: 2
        </div>
        <div className="status-item">
          UTF-8
        </div>
        <div className="status-item">
          {colabCount} {colabCount === 1 ? 'Collaborator' : 'Collaborators'}
        </div>
      </div>
    </footer>
  );
};

export default StatusBar;
