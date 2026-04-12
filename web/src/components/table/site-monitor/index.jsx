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
import CardPro from '../../common/ui/CardPro';
import SiteMonitorDescription from './SiteMonitorDescription';
import SiteMonitorActions from './SiteMonitorActions';
import SiteMonitorTable from './SiteMonitorTable';
import { useSiteMonitorData } from '../../../hooks/site-monitor/useSiteMonitorData';

const SiteMonitorPage = () => {
  const siteMonitorData = useSiteMonitorData();

  return (
    <CardPro
      type='type1'
      descriptionArea={
        <SiteMonitorDescription
          lastUpdatedAt={siteMonitorData.lastUpdatedAt}
          refreshIntervalSeconds={siteMonitorData.refreshIntervalSeconds}
          compactMode={siteMonitorData.compactMode}
          setCompactMode={siteMonitorData.setCompactMode}
          t={siteMonitorData.t}
        />
      }
      actionsArea={
        <SiteMonitorActions
          stats={siteMonitorData.stats}
          autoRefresh={siteMonitorData.autoRefresh}
          setAutoRefresh={siteMonitorData.setAutoRefresh}
          refresh={siteMonitorData.refresh}
          refreshing={siteMonitorData.refreshing}
          t={siteMonitorData.t}
        />
      }
      t={siteMonitorData.t}
    >
      <SiteMonitorTable {...siteMonitorData} />
    </CardPro>
  );
};

export default SiteMonitorPage;
