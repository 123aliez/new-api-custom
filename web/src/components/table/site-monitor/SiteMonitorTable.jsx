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
import { Empty, Tag, Typography } from '@douyinfe/semi-ui';
import {
  IllustrationNoResult,
  IllustrationNoResultDark,
} from '@douyinfe/semi-illustrations';
import CardTable from '../../common/ui/CardTable';
import { renderModelTag } from '../../../helpers';
import {
  renderType,
  renderUseTime,
  renderFirstUseTime,
  renderIsStream,
  getPromptCacheSummary,
} from '../usage-logs/UsageLogsColumnDefs';

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

function formatTokenCount(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return parsed.toLocaleString();
}

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
        title: t('类型'),
        dataIndex: 'type',
        key: 'type',
        width: 80,
        render: (value) => renderType(value, t),
      },
      {
        title: t('模型'),
        dataIndex: 'model_name',
        key: 'model',
        width: 220,
        render: (value) => {
          if (!value) return '-';
          return renderModelTag(value);
        },
      },
      {
        title: t('用时/首字'),
        dataIndex: 'use_time',
        key: 'use_time',
        width: 140,
        render: (text, record) => {
          if (record.type !== 2 && record.type !== 5) return <></>;
          if (record.is_stream) {
            const other = record.other;
            return (
              <>
                {renderUseTime(text, t)}
                {renderFirstUseTime(other?.frt, t)}
                {renderIsStream(record.is_stream, t, other?.stream_status)}
              </>
            );
          }
          return (
            <>
              {renderUseTime(text, t)}
              {renderIsStream(record.is_stream, t)}
            </>
          );
        },
      },
      {
        title: t('输入'),
        dataIndex: 'prompt_tokens',
        key: 'prompt_tokens',
        width: 150,
        render: (text, record) => {
          if (record.type !== 0 && record.type !== 2 && record.type !== 5 && record.type !== 6) {
            return <></>;
          }
          const other = record.other;
          const cacheSummary = getPromptCacheSummary(other);
          const hasCacheRead = (cacheSummary?.cacheReadTokens || 0) > 0;
          const hasCacheWrite = (cacheSummary?.cacheWriteTokens || 0) > 0;
          let cacheText = '';
          if (hasCacheRead && hasCacheWrite) {
            cacheText = `${t('缓存读')} ${formatTokenCount(cacheSummary.cacheReadTokens)} · ${t('写')} ${formatTokenCount(cacheSummary.cacheWriteTokens)}`;
          } else if (hasCacheRead) {
            cacheText = `${t('缓存读')} ${formatTokenCount(cacheSummary.cacheReadTokens)}`;
          } else if (hasCacheWrite) {
            cacheText = `${t('缓存写')} ${formatTokenCount(cacheSummary.cacheWriteTokens)}`;
          }
          return (
            <div
              style={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                lineHeight: 1.2,
              }}
            >
              <span>{text}</span>
              {cacheText ? (
                <span
                  style={{
                    marginTop: 2,
                    fontSize: 11,
                    color: 'var(--semi-color-text-2)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cacheText}
                </span>
              ) : null}
            </div>
          );
        },
      },
      {
        title: t('输出'),
        dataIndex: 'completion_tokens',
        key: 'completion_tokens',
        width: 120,
        render: (text, record) => {
          return parseInt(text) > 0 &&
            (record.type === 0 || record.type === 2 || record.type === 5 || record.type === 6) ? (
            <>{text}</>
          ) : (
            <></>
          );
        },
      },
      {
        title: t('详情'),
        dataIndex: 'content',
        key: 'detail',
        width: 250,
        render: (text, record) => {
          if (record.type === 5 && text) {
            return (
              <Typography.Paragraph
                ellipsis={{
                  rows: 2,
                  showTooltip: {
                    type: 'popover',
                    opts: { style: { width: 240 } },
                  },
                }}
                style={{ maxWidth: 250, marginBottom: 0, color: '#ef4444' }}
              >
                {text}
              </Typography.Paragraph>
            );
          }
          // For consume records, show billing detail like usage logs
          const other = record.other;
          if (record.type === 2 && other) {
            const segments = [];
            const cacheTokens = other.cache_tokens || 0;
            const modelRatio = other.model_ratio;
            const groupRatio = other.group_ratio;
            if (modelRatio || groupRatio) {
              segments.push(`${t('模型倍率')} ${modelRatio || '-'}, ${t('分组')} ${groupRatio || '-'}`);
            }
            if (cacheTokens > 0) {
              segments.push(`${t('缓存')} ${cacheTokens}`);
            }
            if (segments.length > 0) {
              return (
                <div style={{ maxWidth: 250, lineHeight: 1.35 }}>
                  {segments.map((seg, i) => (
                    <Typography.Text
                      key={i}
                      type='tertiary'
                      size='small'
                      style={{ display: 'block', fontSize: 12, marginTop: i === 0 ? 0 : 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {seg}
                    </Typography.Text>
                  ))}
                </div>
              );
            }
          }
          return <span>-</span>;
        },
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
