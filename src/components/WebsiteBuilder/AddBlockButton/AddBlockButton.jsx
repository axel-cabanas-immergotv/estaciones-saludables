import React from 'react';
import { Button, Dropdown } from 'antd';
import { PlusOutlined, DownOutlined } from '@ant-design/icons';

const AddBlockButton = ({ 
  availableBlocks, 
  onAddBlock, 
  buttonText = "Add Block",
  buttonType = "default",
  size = "middle",
  disabled = false 
}) => {
  const handleBlockSelect = (blockType) => {
    if (onAddBlock) {
      onAddBlock(blockType);
    }
  };

  const menuItems = availableBlocks.map((block) => ({
    key: block.type,
    label: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px' }}>{block.icon}</span>
        <span>{block.label}</span>
      </div>
    ),
    onClick: () => handleBlockSelect(block.type)
  }));

  return (
    <Dropdown
      menu={{ items: menuItems }}
      trigger={['click']}
      disabled={disabled}
    >
      <Button 
        icon={<PlusOutlined />} 
        type={buttonType}
        size={size}
        disabled={disabled}
      >
        {buttonText} <DownOutlined />
      </Button>
    </Dropdown>
  );
};

export default AddBlockButton;
