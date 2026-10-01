const CallPanel = ({ roomId }) => {
  return (
    <div className="h-full flex flex-col p-4 items-center justify-center">
      <p className="text-sm text-muted-foreground mb-4">Video/Voice Call</p>
      <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium">
        Join Call
      </button>
    </div>
  );
};

export default CallPanel;
