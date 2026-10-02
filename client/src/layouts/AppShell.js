import React, { useState } from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import TopBar from '../components/features/TopBar';
import ActivityBar from '../components/features/ActivityBar';
import StatusBar from '../components/features/StatusBar';
import LiveWallpaper from '../components/ui/LiveWallpaper';
import './AppShell.css';

const ResizeHandle = ({ direction = 'horizontal' }) => (
  <PanelResizeHandle className={`resize-handle resize-handle-${direction}`}>
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
          <PanelGroup direction="horizontal" className="app-shell-panels" autoSaveId="codesphere-layout-h">
            {/* Left Sidebar */}
            {leftPanel && activeLeftPanel && (
              <>
                <Panel 
                  defaultSize={22} 
                  minSize={12} 
                  maxSize={65} 
                  collapsible={true}
                  className="panel-sidebar chrome-panel floating-tile"
                >
                  {leftPanel(activeLeftPanel)}
                </Panel>
                <ResizeHandle direction="horizontal" />
              </>
            )}

            {/* Center (Editor) & Bottom Panel */}
            <Panel minSize={20} className="panel-center">
              <PanelGroup direction="vertical" autoSaveId="codesphere-layout-v">
                <Panel minSize={15} className="panel-editor-area floating-tile">
                  {children}
                </Panel>
                
                {bottomPanel && (
                  <>
                    <ResizeHandle direction="vertical" />
                    <Panel 
                      defaultSize={32} 
                      minSize={10} 
                      maxSize={85} 
                      collapsible={true}
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
                <ResizeHandle direction="horizontal" />
                <Panel 
                  defaultSize={28} 
                  minSize={12} 
                  maxSize={70} 
                  collapsible={true}
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
