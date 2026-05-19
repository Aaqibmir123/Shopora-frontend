// @ts-nocheck
import React, { useMemo } from 'react';

import { useAuthContext } from '@/context/AuthContext';
import { getAuthSession } from '@/services/tokenStorage';
import { useMeQuery } from '@/store/api/authApi';
import { useMySupportMessagesQuery, useSendMySupportMessageMutation } from '@/store/api/supportApi';
import { SupportChatView } from '@/components/support/SupportChatView';
import type { SupportMessage } from '@/types/models';

type LocalSupportMessage = SupportMessage & {
  localStatus?: 'sending' | 'sent' | 'failed';
};

export function SupportChatScreen({ route }: any) {
  const { sessionReady } = useAuthContext();
  const session = getAuthSession();
  const tokenReady = Boolean(session?.token);
  const composeOnly = Boolean(route?.params?.composeOnly);
  const supportScope = String(route?.params?.scope ?? '').toUpperCase() === 'ORDER' ? 'ORDER' : 'GENERAL';
  const threadId = String(route?.params?.threadId ?? '').trim();
  const orderId = String(route?.params?.orderId ?? '').trim();
  const orderNumber = String(route?.params?.orderNumber ?? '').trim();
  const orderItemId = String(route?.params?.orderItemId ?? '').trim();
  const orderItemTitle = String(route?.params?.orderItemTitle ?? '').trim();

  const supportContext = useMemo(
    () => {
      if (supportScope === 'ORDER') {
        return threadId || orderId || orderNumber || orderItemId || orderItemTitle
          ? {
              threadId: threadId || undefined,
              orderId: orderId || undefined,
              orderNumber: orderNumber || undefined,
              orderItemId: orderItemId || undefined,
              orderItemTitle: orderItemTitle || undefined
            }
          : undefined;
      }

      return threadId ? { threadId } : undefined;
    },
    [supportScope, threadId, orderId, orderNumber, orderItemId, orderItemTitle]
  );

  const [hasSentMessage, setHasSentMessage] = React.useState(false);
  const [optimisticMessages, setOptimisticMessages] = React.useState<LocalSupportMessage[]>([]);
  const sendInFlightRef = React.useRef(false);
  const { data: me } = useMeQuery(undefined, {
    skip: !sessionReady || !tokenReady,
    refetchOnMountOrArgChange: true
  });
  const { data: thread, isFetching, refetch } = useMySupportMessagesQuery(supportContext, {
    skip: !sessionReady || !tokenReady,
    refetchOnMountOrArgChange: true
  });
  const [sendMessage, { isLoading: sending }] = useSendMySupportMessageMutation();
  const resolvedThreadId = thread?.id ?? undefined;
  const resolvedSendContext = {
    threadId: supportContext?.threadId ?? resolvedThreadId,
    ...(supportScope === 'ORDER'
      ? {
          orderId: supportContext?.orderId ?? thread?.orderId ?? undefined,
          orderNumber: supportContext?.orderNumber ?? thread?.orderNumberSnapshot ?? undefined,
          orderItemId: supportContext?.orderItemId ?? thread?.orderItemId ?? undefined,
          orderItemTitle: supportContext?.orderItemTitle ?? thread?.orderItemTitleSnapshot ?? undefined
        }
      : {})
  };

  const allMessages = thread?.messages ?? [];
  const mergedMessages = React.useMemo(() => {
    if (optimisticMessages.length === 0) return allMessages;
    const seen = new Set<string>();
    const combined = [...allMessages, ...optimisticMessages];
    return combined.filter((message) => {
      if (!message?.id) return true;
      if (seen.has(message.id)) return false;
      seen.add(message.id);
      return true;
    });
  }, [allMessages, optimisticMessages]);
  const messages = composeOnly && !hasSentMessage ? [] : mergedMessages;

  React.useEffect(() => {
    if (optimisticMessages.length === 0 || allMessages.length === 0) return;
    setOptimisticMessages((prev) =>
      prev.filter((pending) => {
        const pendingMessage = String(pending.message ?? '').trim();
        const pendingAttachment = pending.attachmentUrl ?? null;
        const pendingRole = pending.senderRole;
        const pendingTime = new Date(pending.createdAt ?? Date.now()).getTime();
        return !allMessages.some((message) => {
          const messageText = String(message.message ?? '').trim();
          const messageAttachment = message.attachmentUrl ?? null;
          const messageRole = message.senderRole;
          const messageTime = new Date(message.createdAt ?? Date.now()).getTime();
          const closeInTime = Math.abs(messageTime - pendingTime) < 5 * 60 * 1000;
          return (
            pendingMessage === messageText &&
            pendingAttachment === messageAttachment &&
            pendingRole === messageRole &&
            closeInTime
          );
        });
      })
    );
  }, [allMessages, optimisticMessages.length]);

  const handleSend = async (message: string, attachmentUrl?: string) => {
    if (sendInFlightRef.current) {
      return;
    }
    sendInFlightRef.current = true;
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimisticMessage: LocalSupportMessage = {
      id: tempId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      threadId: resolvedThreadId ?? resolvedSendContext.threadId ?? tempId,
      senderId: session?.token ?? null,
      senderRole: currentRole,
      senderName: me?.data?.name ?? 'You',
      message: message.trim(),
      attachmentUrl: attachmentUrl ?? null,
      isSystem: false,
      localStatus: 'sending'
    };
    console.log('[support-ui] send-submit', {
      messageLength: message.trim().length,
      hasAttachment: Boolean(attachmentUrl),
      resolvedThreadId,
      supportContext
    });
    setOptimisticMessages((prev) => [...prev, optimisticMessage]);
    try {
      const result = await sendMessage({ message, attachmentUrl, ...resolvedSendContext }).unwrap();
      console.log('[support-ui] send-response', { ok: true, status: 201, payload: result });
      const sentMessage = result?.data?.message ?? result?.message ?? null;
      if (sentMessage) {
        setOptimisticMessages((prev) =>
          prev.map((item) =>
            item.id === tempId
              ? {
                  ...sentMessage,
                  localStatus: 'sent'
                }
              : item
          )
        );
      }
      void refetch().catch((refetchError) => {
        console.log('[support-ui] refetch-after-send:non-fatal', {
          message: refetchError instanceof Error ? refetchError.message : String(refetchError)
        });
      });
      setHasSentMessage(true);
    } catch (error) {
      setOptimisticMessages((prev) =>
        prev.map((item) => (item.id === tempId ? { ...item, localStatus: 'failed' } : item))
      );
      throw error;
    } finally {
      sendInFlightRef.current = false;
    }
  };

  const currentRole = session?.role === 'seller' ? 'SELLER' : session?.role === 'admin' ? 'ADMIN' : 'SHOPPER';
  const supportLabel = supportScope === 'ORDER' && supportContext?.orderNumber
    ? `Order #${supportContext.orderNumber}${supportContext.orderItemTitle ? ` | ${supportContext.orderItemTitle}` : ''}`
    : undefined;
  const threadLabel = supportScope === 'ORDER' && thread?.orderNumberSnapshot
    ? `Order #${thread.orderNumberSnapshot}${thread.orderItemTitleSnapshot ? ` | ${thread.orderItemTitleSnapshot}` : ''}`
    : null;
  const helperText = supportScope === 'ORDER' && supportContext
    ? supportContext.orderNumber || orderId
      ? `This chat is linked to order #${supportContext.orderNumber ?? orderId}.`
      : 'Share your issue, screenshot, or order details and support will reply here.'
    : composeOnly
      ? 'Start a new support message. Your chat will appear here after you send it.'
      : 'Support usually replies in a few minutes during working hours.';

  return (
    <SupportChatView
      title="Support Chat"
      subtitle={supportLabel ?? threadLabel ?? undefined}
      status={thread?.status}
      messages={messages}
      currentRole={currentRole}
      onSend={handleSend}
      sending={sending}
      loading={isFetching && !thread}
      onRefresh={() => void refetch()}
      placeholder="Type your issue, order number, or question"
      helperText={helperText}
      emptyTitle={composeOnly ? 'Start a new chat' : 'No message yet'}
      emptySubtitle={composeOnly ? 'Send your issue, order number, or screenshot to begin.' : 'Send your first message and our support team will reply here.'}
      headerAvatarUri={me?.data?.avatarUrl ?? null}
      headerAvatarLabel={me?.data?.name ?? 'You'}
      showHeaderCard={false}
    />
  );
}
