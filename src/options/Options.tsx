import React, { useState, useEffect } from 'react';
import { Form, Switch, Button, Select, InputNumber, Typography, Progress } from 'antd';
const { Option } = Select;
const { Text } = Typography;

const Options: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [autoSort, setAutoSort] = useState(false);
  const [nextSortTime, setNextSortTime] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState<string>('');
  const [remainingPercentage, setRemainingPercentage] = useState(0);

  useEffect(() => {
    chrome.storage.local.get(['sortBy', 'autoSort', 'sortInterval', 'nextSortTime'], (result) => {
      form.setFieldsValue({
        sortBy: result.sortBy || 'url',
        autoSort: result.autoSort || false,
        sortInterval: result.sortInterval || 15
      });
      
      setAutoSort(result.autoSort || false);
      setNextSortTime(result.nextSortTime || null);
      setLoading(false);
    });
  }, [form]);

  useEffect(() => {
    if (!autoSort || nextSortTime === null) {
      setRemainingTime('');
      setRemainingPercentage(0);
      return;
    }

    const updateRemainingTime = () => {
      chrome.alarms.get('tabSortAlarm', (alarm) => {
        if (alarm && alarm.scheduledTime) {
          const now = Date.now();
          const sortInterval = form.getFieldValue('sortInterval') || 15;
          const intervalMs = sortInterval * 60 * 1000;
          
          if (alarm.scheduledTime > now) {
            const timeRemaining = alarm.scheduledTime - now;
            const minutes = Math.floor(timeRemaining / 60000);
            const seconds = Math.floor((timeRemaining % 60000) / 1000);
            
            setRemainingTime(`${minutes}分${seconds}秒`);
            
            const elapsedPercentage = 100 - ((timeRemaining / intervalMs) * 100);
            setRemainingPercentage(Math.min(Math.max(elapsedPercentage, 0), 100));
          } else {
            chrome.storage.local.get(['autoSort'], (result) => {
              if (result.autoSort) {
                updateRemainingTime();
              }
            });
          }
        }
      });
    };

    updateRemainingTime();
    
    const timer = setInterval(updateRemainingTime, 1000);
    
    return () => clearInterval(timer);
  }, [autoSort, nextSortTime, form]);

  useEffect(() => {
    const storageListener = (changes: {[key: string]: chrome.storage.StorageChange}, area: string) => {
      if (area === 'local' && changes.nextSortTime) {
        setNextSortTime(changes.nextSortTime.newValue);
      }
      
      if (area === 'local' && changes.autoSort) {
        setAutoSort(changes.autoSort.newValue);
      }
    };
    
    chrome.storage.onChanged.addListener(storageListener);
    
    return () => {
      chrome.storage.onChanged.removeListener(storageListener);
    };
  }, []);
  

  const onFinish = (values: any) => {
    setAutoSort(values.autoSort);
    
    chrome.runtime.sendMessage(
      {
        action: 'updateAutoSort',
        autoSort: values.autoSort,
        sortInterval: values.sortInterval,
        sortBy: values.sortBy
      },
      function (response) {
        console.log('设置已更新:', response);
        
        if (values.autoSort) {
          chrome.storage.local.get(['nextSortTime'], (result) => {
            setNextSortTime(result.nextSortTime);
          });
        } else {
          setNextSortTime(null);
        }
      }
    );
  };

  const handleAutoSortChange = (checked: boolean) => {
    setAutoSort(checked);
  };

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <h1>标签排序设置</h1>
      <Form 
        form={form} 
        layout="vertical" 
        onFinish={onFinish}
        disabled={loading}
      >
        <Form.Item name="sortBy" label="排序方式" rules={[{ required: true }]}>
          <Select>
            <Option value="url">URL</Option>
            <Option value="title">标题</Option>
          </Select>
        </Form.Item>
        
        <Form.Item name="autoSort" label="自动排序" valuePropName="checked">
          <Switch onChange={handleAutoSortChange} />
        </Form.Item>
        
        <Form.Item 
          name="sortInterval" 
          label="排序间隔（分钟）"
          rules={[{ required: true, type: 'number', min: 1, message: '请输入有效的分钟数' }]}
        >
          <InputNumber min={1} max={1440} />
        </Form.Item>
        
        {autoSort && nextSortTime && (
          <div style={{ marginBottom: 24 }}>
            <Text strong>下次排序剩余时间: {remainingTime}</Text>
            <Progress percent={remainingPercentage} status="active" />
          </div>
        )}
        
        <Form.Item>
          <Button type="primary" htmlType="submit">
            保存设置
          </Button>
          <Button 
            style={{ marginLeft: 8 }} 
            onClick={() => {
              chrome.runtime.sendMessage(
                {
                  action: 'sortTabs',
                  sortBy: form.getFieldValue('sortBy') || 'url',
                },
                function (response) {
                  if (autoSort) {
                    setTimeout(() => {
                      chrome.storage.local.get(['nextSortTime'], (result) => {
                        setNextSortTime(result.nextSortTime);
                      });
                    }, 100);
                  }
                }
              );
            }}
          >
            立即排序
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Options;
