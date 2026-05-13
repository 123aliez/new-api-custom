/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React from 'react';
import { Button, Space, Switch, Tag, Typography } from '@douyinfe/semi-ui';
import { renderNumber, renderQuota } from '../../../helpers';

const { Text } = Typography;

const SiteMonitorActions = ({
  stats,
  autoRefresh,
  setAutoRefresh,
  refresh,
  refreshing,
  t,
}) => {
  return (
    <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-3 w-full'>
      <Space wrap>
        <Tag color='blue' size='large' shape='circle'>
          {t('记录数')}: {stats.count}
        </Tag>
        <Tag color='green' size='large' shape='circle'>
          {t('输入 Tokens')}: {renderNumber(stats.promptTokens)}
        </Tag>
        <Tag color='teal' size='large' shape='circle'>
          {t('缓存读')}: {renderNumber(stats.cacheReadTokens)}
        </Tag>
        <Tag color='cyan' size='large' shape='circle'>
          {t('输出 Tokens')}: {renderNumber(stats.completionTokens)}
        </Tag>
        <Tag color='orange' size='large' shape='circle'>
          {t('消耗额度')}: {renderQuota(stats.quota)}
        </Tag>
        {stats.errorCount > 0 && (
          <Tag color='red' size='large' shape='circle'>
            {t('失败')}: {stats.errorCount}
          </Tag>
        )}
      </Space>

      <Space wrap>
        <Space>
          <Text>{t('自动刷新')}</Text>
          <Switch checked={autoRefresh} onChange={setAutoRefresh} />
        </Space>
        <Button type='primary' theme='light' loading={refreshing} onClick={refresh}>
          {t('立即刷新')}
        </Button>
      </Space>
    </div>
  );
};

export default SiteMonitorActions;
