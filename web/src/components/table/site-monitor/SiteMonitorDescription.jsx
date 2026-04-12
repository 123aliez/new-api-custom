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
import { Space, Tag, Typography } from '@douyinfe/semi-ui';
import { Activity } from 'lucide-react';
import CompactModeToggle from '../../common/ui/CompactModeToggle';

const { Text } = Typography;

const SiteMonitorDescription = ({
  lastUpdatedAt,
  refreshIntervalSeconds,
  compactMode,
  setCompactMode,
  t,
}) => {
  return (
    <div className='flex flex-col gap-2 w-full'>
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-2 w-full'>
        <div className='flex items-center text-blue-500'>
          <Activity size={16} className='mr-2' />
          <Text>{t('全站监控')}</Text>
        </div>
        <CompactModeToggle
          compactMode={compactMode}
          setCompactMode={setCompactMode}
          t={t}
        />
      </div>
      <Space wrap>
        <Tag color='blue' shape='circle'>
          {t('近100条使用记录')}
        </Tag>
        <Tag color='green' shape='circle'>
          {t('用户名已匿名显示')}
        </Tag>
        <Tag color='cyan' shape='circle'>
          {t('自动刷新')} {refreshIntervalSeconds}s
        </Tag>
      </Space>
      <Text type='tertiary'>
        {t('最近刷新')}: {lastUpdatedAt ? new Date(lastUpdatedAt * 1000).toLocaleString() : '-'}
      </Text>
    </div>
  );
};

export default SiteMonitorDescription;
