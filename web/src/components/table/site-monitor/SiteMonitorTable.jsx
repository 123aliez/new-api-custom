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

import React, { useMemo } from 'react';
import { Empty, Tag } from '@douyinfe/semi-ui';
import {
  IllustrationNoResult,
  IllustrationNoResultDark,
} from '@douyinfe/semi-illustrations';
import CardTable from '../../common/ui/CardTable';
import { renderNumber, renderQuota } from '../../../helpers';

const userColors = [
  'amber',
  'blue',
  'cyan',
  'green',
  'grey',
  'indigo',
  'lime',
  'orange',
  'pink',
  'purple',
  'red',
  'teal',
  'violet',
  'yellow',
];

const renderUseTime = (value) => {
  const seconds = Number(value || 0);
  if (seconds <= 0) {
    return <span>-</span>;
  }
  if (seconds < 30) {
    return <Tag color='green' shape='circle'>{seconds}s</Tag>;
  }
  if (seconds < 120) {
    return <Tag color='orange' shape='circle'>{seconds}s</Tag>;
  }
  return <Tag color='red' shape='circle'>{seconds}s</Tag>;
};

const SiteMonitorTable = ({ records, loading, compactMode, t }) => {
  const columns = useMemo(
    () => [
      {
        title: t('时间'),
        dataIndex: 'timestamp2string',
        key: 'time',
        width: 180,
      },
      {
        title: t('用户'),
        dataIndex: 'user_id',
        key: 'user',
        width: 120,
        render: (value, record) => {
          const alias = Number(value || record?.other?.user_alias_index || 0);
          return (
            <Tag
              color={userColors[(Math.max(alias, 1) - 1 + userColors.length) % userColors.length]}
              shape='circle'
            >
              {t('匿名用户')} {alias || '-'}
            </Tag>
          );
        },
      },
      {
        title: t('模型'),
        dataIndex: 'model_name',
        key: 'model',
        width: 220,
        render: (value) => value || '-',
      },
      {
        title: t('输入'),
        dataIndex: 'prompt_tokens',
        key: 'prompt_tokens',
        width: 120,
        render: (value) => renderNumber(value || 0),
      },
      {
        title: t('缓存读'),
        dataIndex: 'other',
        key: 'cache_read',
        width: 100,
        render: (value) => {
          const cacheTokens = Number(value?.cache_tokens || 0);
          return cacheTokens > 0 ? (
            <Tag color='teal' size='small' shape='circle'>{renderNumber(cacheTokens)}</Tag>
          ) : (
            <span>-</span>
          );
        },
      },
      {
        title: t('缓存写'),
        dataIndex: 'other',
        key: 'cache_write',
        width: 100,
        render: (value) => {
          const writeTokens = Number(value?.cache_write_tokens || 0);
          return writeTokens > 0 ? (
            <Tag color='violet' size='small' shape='circle'>{renderNumber(writeTokens)}</Tag>
          ) : (
            <span>-</span>
          );
        },
      },
      {
        title: t('输出'),
        dataIndex: 'completion_tokens',
        key: 'completion_tokens',
        width: 120,
        render: (value) => renderNumber(value || 0),
      },
      {
        title: t('花费'),
        dataIndex: 'quota',
        key: 'quota',
        width: 120,
        render: (value) => renderQuota(value || 0, 6),
      },
      {
        title: t('用时'),
        dataIndex: 'use_time',
        key: 'use_time',
        width: 100,
        render: (value) => renderUseTime(value),
      },
      {
        title: t('模式'),
        dataIndex: 'is_stream',
        key: 'mode',
        width: 100,
        render: (value) =>
          value ? (
            <Tag color='blue' shape='circle'>
              {t('流')}
            </Tag>
          ) : (
            <Tag color='purple' shape='circle'>
              {t('非流')}
            </Tag>
          ),
      },
    ],
    [t],
  );

  return (
    <CardTable
      columns={columns}
      dataSource={records}
      rowKey='key'
      loading={loading}
      scroll={compactMode ? undefined : { x: 'max-content' }}
      hidePagination={true}
      size='small'
      empty={
        <Empty
          image={<IllustrationNoResult style={{ width: 150, height: 150 }} />}
          darkModeImage={
            <IllustrationNoResultDark style={{ width: 150, height: 150 }} />
          }
          description={t('暂无监控数据')}
          style={{ padding: 30 }}
        />
      }
    />
  );
};

export default SiteMonitorTable;
