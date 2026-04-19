import { useState } from 'react';
import { Menu, TextInput } from 'react-native-paper';
import { View } from 'react-native';

type MenuOption = {
  label: string;
  value: string;
};

export function MenuSelect({
  label,
  placeholder,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  placeholder?: string;
  value: string;
  options: MenuOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  const selectedLabel = options.find((option) => option.value === value)?.label ?? '';

  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <View>
          <TextInput
            label={label}
            value={selectedLabel}
            placeholder={placeholder}
            mode="outlined"
            editable={false}
            disabled={disabled}
            right={<TextInput.Icon icon="chevron-down" onPress={() => setVisible(true)} />}
            onPressIn={() => setVisible(true)}
          />
        </View>
      }
      contentStyle={{ minWidth: 240 }}
    >
      {options.map((option) => (
        <Menu.Item
          key={option.value}
          onPress={() => {
            onChange(option.value);
            setVisible(false);
          }}
          title={option.label}
        />
      ))}
    </Menu>
  );
}

