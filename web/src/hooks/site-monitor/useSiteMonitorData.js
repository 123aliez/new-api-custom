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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { API, getLogOther, showError, timestamp2string } from '../../helpers';
import { useTableCompactMode } from '../common/useTableCompactMode';

const SITE_MONITOR_LIMIT = 100;
const AUTO_REFRESH_INTERVAL_MS = 10000;

export const useSiteMonitorData = () => {
  const { t } = useTranslation();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [autoRefresh, setAutoRefreshRaw] = useState(() => {
    const saved = localStorage.getItem('site_monitor_auto_refresh');
    return saved !== null ? saved === 'true' : true;
  });
  const setAutoRefresh = useCallback((value) => {
    const resolved = typeof value === 'function' ? value : value;
    setAutoRefreshRaw((prev) => {
      const next = typeof resolved === 'function' ? resolved(prev) : resolved;
      localStorage.setItem('site_monitor_auto_refresh', String(next));
      return next;
    });
  }, []);
  const [compactMode, setCompactMode] = useTableCompactMode('site-monitor');
  const fetchingRef = useRef(false);

  const loadRecords = useCallback(
    async (silent = false) => {
      if (fetchingRef.current) {
        return;
      }
      fetchingRef.current = true;

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const res = await API.get(`/api/log/monitor?limit=${SITE_MONITOR_LIMIT}`);
        const { success, message, data } = res.data;
        if (!success) {
          if (!silent) {
            showError(message || t('加载失败'));
          }
          return;
        }

        const nextRecords = (data?.items || []).map((item) => ({
          ...item,
          other: getLogOther(item.other),
          key: item.id,
          timestamp2string: timestamp2string(item.created_at),
        }));
        setRecords(nextRecords);
        setLastUpdatedAt(data?.updated_at || Math.floor(Date.now() / 1000));
      } catch (error) {
        if (!silent) {
          showError(t('请求失败'));
        }
      } finally {
        if (silent) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
        fetchingRef.current = false;
      }
    },
    [t],
  );

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  useEffect(() => {
    if (!autoRefresh) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      loadRecords(true);
    }, AUTO_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [autoRefresh, loadRecords]);

  const stats = useMemo(() => {
    return records.reduce(
      (acc, record) => {
        acc.count += 1;
        acc.promptTokens += Number(record.prompt_tokens || 0);
        acc.completionTokens += Number(record.completion_tokens || 0);
        acc.quota += Number(record.quota || 0);
        const other = record.other || {};
        acc.cacheReadTokens += Number(other.cache_tokens || 0);
        acc.cacheWriteTokens += Number(other.cache_write_tokens || 0);
        if (other.is_error) acc.errorCount += 1;
        return acc;
      },
      {
        count: 0,
        promptTokens: 0,
        completionTokens: 0,
        quota: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        errorCount: 0,
      },
    );
  }, [records]);

  return {
    records,
    loading,
    refreshing,
    lastUpdatedAt,
    autoRefresh,
    setAutoRefresh,
    compactMode,
    setCompactMode,
    refresh: () => loadRecords(true),
    refreshIntervalSeconds: AUTO_REFRESH_INTERVAL_MS / 1000,
    stats,
    t,
  };
};
