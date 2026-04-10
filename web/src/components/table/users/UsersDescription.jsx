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

import React, { useEffect, useState } from 'react';
import { Tag, Typography } from '@douyinfe/semi-ui';
import { IconUserAdd } from '@douyinfe/semi-icons';
import CompactModeToggle from '../../common/ui/CompactModeToggle';
import { API } from '../../../helpers';

const { Text } = Typography;

const UsersDescription = ({ compactMode, setCompactMode, t }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    API.get('/api/user/stats')
      .then((res) => {
        if (res.data?.success) {
          setStats(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className='flex flex-col gap-2 w-full'>
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-2 w-full'>
        <div className='flex items-center text-blue-500'>
          <IconUserAdd className='mr-2' />
          <Text>{t('用户管理')}</Text>
        </div>
        <CompactModeToggle
          compactMode={compactMode}
          setCompactMode={setCompactMode}
          t={t}
        />
      </div>
      {stats && (
        <div className='flex flex-wrap gap-3 items-center'>
          <Tag color='blue' size='large' shape='circle'>
            {t('全部用户')}: {stats.total_users}
          </Tag>
          <Tag color='green' size='large' shape='circle'>
            {t('活跃用户')}: {stats.active_users}
          </Tag>
          <Tag color='cyan' size='large' shape='circle'>
            {t('有订阅')}: {stats.users_with_subscription}
          </Tag>
          <Tag color='amber' size='large' shape='circle'>
            {t('有余额')}: {stats.users_with_balance}
          </Tag>
          <Tag color='red' size='large' shape='circle'>
            {t('无活跃')}: {stats.inactive_users}
          </Tag>
        </div>
      )}
    </div>
  );
};

export default UsersDescription;
