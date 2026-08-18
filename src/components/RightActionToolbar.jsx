import React from 'react';
import { 
  Code2, 
  Wand2, 
  Plus, 
  Sparkles 
} from 'lucide-react';

export default function RightActionToolbar({ 
  actions, 
  onExecuteAction, 
  onOpenSettings,
  onOpenSettingsForAction
}) {
  const handleOpenCustomAdd = () => {
    if (onOpenSettings) {
      onOpenSettings('actions');
    } else if (onOpenSettingsForAction) {
      onOpenSettingsForAction();
    }
  };

  return (
    <aside className="right-action-toolbar" aria-label="Quick Actions">
      <div className="toolbar-header">
        <Sparkles size={12} className="toolbar-icon-glow" />
        <span className="toolbar-title">Actions</span>
      </div>

      <div className="action-buttons-list">
        {actions.map((action, index) => {
          const isJson = action.id === 'json-format';
          return (
            <button
              key={action.id || index}
              className={`action-tool-btn ${isJson ? 'btn-json-format' : ''}`}
              onClick={() => onExecuteAction(action)}
              title={`${action.name}\n${action.description || (action.pattern ? `置換: /${action.pattern}/${action.flags || 'g'} → "${action.replacement}"` : '')}`}
            >
              {isJson ? (
                <Code2 size={16} />
              ) : (
                <Wand2 size={15} />
              )}
              <span className="action-tool-name">{action.name}</span>
            </button>
          );
        })}
      </div>

      <div className="toolbar-footer">
        <button 
          className="action-tool-btn btn-add-action"
          onClick={handleOpenCustomAdd}
          title="正規表現アクションを追加・編集"
        >
          <Plus size={14} />
          <span>カスタム追加</span>
        </button>
      </div>
    </aside>
  );
}
