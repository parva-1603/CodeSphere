import React, { useState } from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import TopBar from '../components/features/TopBar';
import ActivityBar from '../components/features/ActivityBar';
import StatusBar from '../components/features/StatusBar';
import LiveWallpaper from '../components/ui/LiveWallpaper';
import './AppShell.css';

const ResizeHandle = () => (
  <PanelResizeHandle className="resize-handle">
    <div className="resize-handle-inner" />
  </PanelResizeHandle>
);

const AppShell = ({ 
  children, 
  leftPanel, 
  rightPanel, 
  bottomPanel,
  activeLeftPanel: controlledActiveLeftPanel,
  onLeftPanelChange: controlledOnLeftPanelChange,
  projectName = 'CodeSphere Project',
  connectionStatus = 'connected',
  cursor = { line: 1, col: 1 },
  colabCount = 1
}) => {
  const [internalActiveLeftPanel, setInternalActiveLeftPanel] = useState('explorer');

  const activeLeftPanel = controlledActiveLeftPanel !== undefined ? controlledActiveLeftPanel : internalActiveLeftPanel;
  const handlePanelChange = controlledOnLeftPanelChange || setInternalActiveLeftPanel;

  return (
    <div className="app-shell">
      <LiveWallpaper />
      <TopBar projectName={projectName} />
      
      <div className="app-shell-main">
        <ActivityBar activePanel={activeLeftPanel} onPanelChange={handlePanelChange} />
        
        <div className="app-shell-panels-wrapper">
          <PanelGroup orientation="horizontal" className="app-shell-panels">
            {/* Left Sidebar */}
            {leftPanel && activeLeftPanel && (
              <>
                <Panel 
                  id="left-sidebar"
                  defaultSize="22%" 
                  minSize="15%" 
                  maxSize="40%" 
                  className="panel-sidebar chrome-panel floating-tile"
                >
                  {leftPanel(activeLeftPanel)}
                </Panel>
                <ResizeHandle />
              </>
            )}

            {/* Center (Editor) & Bottom Panel */}
            <Panel id="center-panel" minSize="30%" className="panel-center">
              <PanelGroup orientation="vertical" className="panel-center-group">
                <Panel id="editor-area" minSize="20%" className="panel-editor-area floating-tile">
                  {children}
                </Panel>
                
                {bottomPanel && (
                  <>
                    <ResizeHandle />
                    <Panel 
                      id="bottom-terminal"
                      defaultSize="35%" 
                      minSize="15%" 
                      maxSize="70%" 
                      className="panel-bottom chrome-panel floating-tile"
                    >
                      {bottomPanel}
                    </Panel>
                  </>
                )}
              </PanelGroup>
            </Panel>

            {/* Right Sidebar */}
            {rightPanel && (
              <>
                <ResizeHandle />
                <Panel 
                  id="right-dock"
                  defaultSize="25%" 
                  minSize="18%" 
                  maxSize="45%" 
                  className="panel-right chrome-panel floating-tile"
                >
                  {rightPanel}
                </Panel>
              </>
            )}
          </PanelGroup>
        </div>
      </div>

      <StatusBar connectionStatus={connectionStatus} cursor={cursor} colabCount={colabCount} />
    </div>
  );
};

export default AppShell;
