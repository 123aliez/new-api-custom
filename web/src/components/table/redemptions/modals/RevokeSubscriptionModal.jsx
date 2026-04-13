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
import { Modal, Typography } from '@douyinfe/semi-ui';
import { REDEMPTION_ACTIONS } from '../../../../constants/redemption.constants';

const { Text } = Typography;

const RevokeSubscriptionModal = ({
  visible,
  onCancel,
  record,
  manageRedemption,
  refresh,
  t,
}) => {
  const handleConfirm = async () => {
    if (!record?.id) {
      return;
    }
    const success = await manageRedemption(
      record.id,
      REDEMPTION_ACTIONS.REVOKE,
      record,
    );
    if (!success) {
      return;
    }
    await refresh();
    onCancel();
  };

  return (
    <Modal
      title={t('确定撤销该订阅兑换码吗？')}
      visible={visible}
      onCancel={onCancel}
      onOk={handleConfirm}
      type='warning'
    >
      <div className='flex flex-col gap-2'>
        <Text>{t('撤销后，关联订阅将立即失效，兑换码会恢复为未使用状态。')}</Text>
        <Text>{`${t('用户ID')}: ${record?.used_user_id || '-'}`}</Text>
        <Text>{`${t('订阅套餐')}: ${record?.plan_title || `#${record?.plan_id || '-'}`}`}</Text>
      </div>
    </Modal>
  );
};

export default RevokeSubscriptionModal;
