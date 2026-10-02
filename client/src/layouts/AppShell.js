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

const AppShell = ({ children, leftPanel, rightPanel, bottomPanel }) => {
  const [activeLeftPanel, setActiveLeftPanel] = useState('explorer');

  return (
    <div className="app-shell">
      <LiveWallpaper />
      <TopBar />
      
      <div className="app-shell-main">
        <ActivityBar activePanel={activeLeftPanel} onPanelChange={setActiveLeftPanel} />
        
        <div className="app-shell-panels-wrapper">
          <PanelGroup direction="horizontal" className="app-shell-panels">
            {/* Left Sidebar */}
            {leftPanel && (
              <>
                <Panel defaultSize={20} minSize={15} maxSize={40} className="panel-sidebar chrome-panel floating-tile">
                  {leftPanel(activeLeftPanel)}
                </Panel>
                <ResizeHandle />
              </>
            )}

            {/* Center (Editor) & Bottom Panel */}
            <Panel className="panel-center">
              <PanelGroup direction="vertical">
                <Panel className="panel-editor-area floating-tile">
                  {children}
                </Panel>
                
                {bottomPanel && (
                  <>
                    <ResizeHandle />
                    <Panel defaultSize={25} minSize={10} maxSize={50} className="panel-bottom floating-tile">
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
                <Panel defaultSize={25} minSize={20} maxSize={40} className="panel-right chrome-panel floating-tile">
                  {rightPanel}
                </Panel>
              </>
            )}
          </PanelGroup>
        </div>
      </div>

      <StatusBar />
    </div>
  );
};

export default AppShell;
