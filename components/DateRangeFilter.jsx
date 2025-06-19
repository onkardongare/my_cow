import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';

const DateRangeFilter = ({ visible, onClose, onSelect, selectedRange }) => {
  const { t } = useTranslation();

  const ranges = [
    { key: 'last7Days', label: 'Last 7 Days' },
    { key: 'currentMonth', label: 'Current Month' },
    { key: 'previousMonth', label: 'Previous Month' },
    { key: 'last3Months', label: 'Last 3 Months' },
    { key: 'last6Months', label: 'Last 6 Months' },
    { key: 'last12Months', label: 'Last 12 Months' },
    { key: 'currentYear', label: 'Current Year' },
    { key: 'previousYear', label: 'Previous Year' },
    { key: 'last3Years', label: 'Last 3 Years' },
    { key: 'allTime', label: 'All time' },
    { key: 'customRange', label: 'Custom Range' },
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        className="flex-1 bg-black/50"
        activeOpacity={1}
        onPress={onClose}
      >
        <View className="flex-1 justify-end">
          <View className="bg-white rounded-t-3xl pb-20">
            <View className="p-4 border-b border-gray-200">
              <Text className="text-xl font-semibold text-center">Select Range</Text>
            </View>
            
            <View className="max-h-[70%]">
              {ranges.map((range) => (
                <TouchableOpacity
                  key={range.key}
                  className={`p-4 border-b border-gray-100 flex-row justify-between items-center ${
                    selectedRange === range.key ? 'bg-green-50' : ''
                  }`}
                  onPress={() => {
                    onSelect(range.key);
                    onClose();
                  }}
                >
                  <Text className={`text-base ${
                    selectedRange === range.key ? 'text-green-600 font-semibold' : 'text-gray-700'
                  }`}>
                    {range.label}
                  </Text>
                  {selectedRange === range.key && (
                    <View className="w-4 h-4 rounded-full bg-green-500" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default DateRangeFilter; 