import React from 'react';

import { SupportChatView } from '@/components/support/SupportChatView';
import { useAdminSupportThreadQuery, useSendAdminSupportMessageMutation } from '@/store/api/supportApi';

export function AdminSupportThreadScreen({ route }: any) {
  const threadId = String(route.params?.threadId ?? '');
  const { data: thread, isFetching, refetch } = useAdminSupportThreadQuery(threadId, {
    skip: !threadId,
    refetchOnMountOrArgChange: true
  });
  const [sendMessage, { isLoading: sending }] = useSendAdminSupportMessageMutation();

  React.useEffect(() => {
    console.log('[support-ui][admin-thread]', {
      threadId,
      hasThread: Boolean(thread),
      messageCount: Array.isArray(thread?.messages) ? thread.messages.length : 0,
      latestMessage: thread?.latestMessage?.message ?? null,
      customerLabel: thread?.customerLabel ?? null
    });
  }, [thread, threadId]);

  const handleSend = async (message: string, attachmentUrl?: string) => {
    await sendMessage({ threadId, message, attachmentUrl }).unwrap();
  };

  const subtitle = thread
    ? [
        thread.customerLabel ?? thread.user?.name ?? thread.user?.phone ?? 'Customer ticket',
        thread.orderNumberSnapshot ? `Order #${thread.orderNumberSnapshot}` : null,
        thread.orderItemTitleSnapshot ?? null
      ]
        .filter(Boolean)
        .join(' • ')
    : 'Customer ticket';

  return (
    <SupportChatView
      title="User Support"
      subtitle={subtitle}
      status={thread?.status}
      messages={thread?.messages ?? []}
      currentRole="ADMIN"
      onSend={handleSend}
      sending={sending}
      loading={isFetching && !thread}
      onRefresh={() => void refetch()}
      placeholder="Write the support reply"
      helperText="Reply to the user here."
      emptyTitle="Waiting for user messages"
      emptySubtitle="As soon as the customer writes here, the full conversation appears in this thread."
      headerAvatarUri={thread?.user?.avatarUrl ?? null}
      headerAvatarLabel={thread?.customerLabel ?? thread?.user?.name ?? thread?.user?.phone ?? 'Customer'}
    />
  );
}
