import React from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { AppText } from '@/components/common/AppText';
import { AppTheme } from '@/theme';
import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { pickAndUploadImage } from '@/services/imageUpload';
import type { SupportMessage, SupportSenderRole, SupportThreadStatus } from '@/types/models';

type Props = {
  title: string;
  subtitle?: string;
  status?: SupportThreadStatus;
  statusTone?: 'primary' | 'info' | 'success' | 'danger';
  messages: SupportMessage[];
  currentRole: SupportSenderRole;
  onSend: (message: string, attachmentUrl?: string) => Promise<void> | void;
  sending?: boolean;
  loading?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  placeholder?: string;
  helperText?: string;
  onRefresh?: () => void;
  headerAvatarUri?: string | null;
  headerAvatarLabel?: string;
  headerActions?: React.ReactNode;
  showHeaderCard?: boolean;
};

const toneByStatus: Record<SupportThreadStatus, 'primary' | 'info' | 'success' | 'danger'> = {
  OPEN: 'success',
  PENDING: 'info',
  RESOLVED: 'primary',
  CLOSED: 'danger'
};

const formatMessageStamp = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
};

const getInitials = (value?: string) =>
  String(value ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

export function SupportChatView({
  title,
  subtitle,
  status,
  statusTone,
  messages,
  currentRole,
  onSend,
  sending,
  loading,
  emptyTitle = 'Start the conversation',
  emptySubtitle = 'Share your issue, order number, or screenshot and the support team will reply here.',
  placeholder = 'Type your message',
  helperText,
  onRefresh,
  headerAvatarUri,
  headerAvatarLabel,
  headerActions,
  showHeaderCard = true
}: Props) {
  const [draft, setDraft] = React.useState('');
  const [attachmentUrl, setAttachmentUrl] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const listRef = React.useRef<FlatList<SupportMessage> | null>(null);
  const resolvedStatusTone = status ? toneByStatus[status] : statusTone ?? 'info';

  React.useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }, [messages.length]);

  const handlePickImage = async () => {
    try {
      setUploading(true);
      setError(null);
      const uploaded = await pickAndUploadImage();
      if (uploaded) {
        setAttachmentUrl(uploaded);
      }
    } catch (err: any) {
      setError(err?.message ?? 'Could not upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async () => {
    const next = draft.trim();
    if (!next && !attachmentUrl) return;
    try {
      setError(null);
      console.log('[support-ui] send-button-press', {
        messageLength: next.length,
        hasAttachment: Boolean(attachmentUrl)
      });
      await onSend(next, attachmentUrl ?? undefined);
      setDraft('');
      setAttachmentUrl(null);
    } catch (err: any) {
      const fallbackMessage = 'Could not send message. Please check your connection and try again.';
      const responseMessage =
        err?.body?.message ??
        err?.data?.message ??
        err?.message ??
        err?.error?.message ??
        null;
      setError(responseMessage && typeof responseMessage === 'string' ? responseMessage : fallbackMessage);
    }
  };

  return (
    <Screen>
      <PageHeader title={title} subtitle={subtitle} rightLabel={onRefresh ? 'Refresh' : undefined} onRightPress={onRefresh} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
      >
        <View style={styles.container}>
          {showHeaderCard ? (
            <SectionCard style={styles.hero}>
              <View style={styles.heroTop}>
                <View style={styles.heroAvatar}>
                  {headerAvatarUri ? (
                    <Image source={{ uri: headerAvatarUri }} style={styles.heroAvatarImage} contentFit="cover" />
                  ) : (
                    <AppText variant="title" tone="primary">
                      {getInitials(headerAvatarLabel ?? title)}
                    </AppText>
                  )}
                </View>
                <View style={{ flex: 1 }} />
                {status ? (
                  <View style={[styles.statusPill, styles[`status${resolvedStatusTone}` as const]]}>
                    <AppText variant="small" tone="white">
                      {status}
                    </AppText>
                  </View>
                ) : null}
              </View>
              {headerActions ? <View style={styles.heroActions}>{headerActions}</View> : null}
            </SectionCard>
          ) : null}

          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSystem = item.isSystem;
              const isMine = !isSystem && item.senderRole === currentRole;
              return (
                <View
                  style={[
                    styles.bubbleRow,
                    isSystem ? styles.systemRow : isMine ? styles.mineRow : styles.theirRow
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      isSystem ? styles.systemBubble : isMine ? styles.mineBubble : styles.theirBubble
                    ]}
                  >
                    {isSystem ? (
                      <View style={styles.systemMeta}>
                        <Ionicons name="information-circle-outline" size={16} color={AppTheme.colors.primary} />
                        <AppText variant="small" tone="primary" style={styles.systemLabel}>
                          NovaMart Support
                        </AppText>
                      </View>
                    ) : (
                      <AppText variant="small" tone={isMine ? 'white' : 'soft'} style={styles.sender}>
                        {isMine ? 'You' : item.senderName}
                      </AppText>
                    )}
                    {item.message ? (
                      <AppText variant="body" tone={isSystem ? 'soft' : isMine ? 'white' : 'default'} style={styles.messageText}>
                        {item.message}
                      </AppText>
                    ) : null}
                    {item.attachmentUrl ? (
                      <View style={styles.attachmentWrap}>
                        <Image source={{ uri: item.attachmentUrl }} style={styles.attachmentImage} contentFit="cover" />
                      </View>
                    ) : null}
                    {((item as any).localStatus === 'sending' || (item as any).localStatus === 'failed') ? (
                      <View style={styles.localStatusRow}>
                        <Ionicons
                          name={(item as any).localStatus === 'failed' ? 'alert-circle-outline' : 'time-outline'}
                          size={12}
                          color={isMine ? AppTheme.colors.white : AppTheme.colors.textSoft}
                        />
                        <AppText variant="small" tone={isMine ? 'white' : 'soft'} style={styles.localStatusText}>
                          {(item as any).localStatus === 'failed'
                            ? 'Failed to send'
                            : (item as any).localStatus === 'sent'
                              ? 'Sent'
                              : 'Sending...'}
                        </AppText>
                      </View>
                    ) : null}
                    <AppText variant="small" tone={isSystem ? 'soft' : isMine ? 'white' : 'soft'} style={styles.timeText}>
                      {formatMessageStamp(item.createdAt)}
                    </AppText>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              loading ? null : (
                <SectionCard style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="chatbubble-outline" size={26} color={AppTheme.colors.primary} />
                  </View>
                  <AppText variant="title" style={styles.emptyTitle}>
                    {emptyTitle}
                  </AppText>
                  <AppText variant="body" tone="soft" style={styles.emptySubtitle}>
                    {emptySubtitle}
                  </AppText>
                </SectionCard>
              )
            }
          />

          <SectionCard style={styles.composerCard}>
            <View style={styles.composerInputWrap}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={placeholder}
                placeholderTextColor={AppTheme.colors.textSoft + '80'}
                multiline
                numberOfLines={3}
                blurOnSubmit={false}
                returnKeyType="send"
                onSubmitEditing={() => void handleSend()}
                textAlignVertical="top"
                style={styles.composerInput}
              />
            </View>
            {attachmentUrl ? (
              <View style={styles.attachmentPreviewBlock}>
                <View style={styles.attachmentPreviewCard}>
                  <Image source={{ uri: attachmentUrl }} style={styles.attachmentPreview} contentFit="cover" />
                  <Pressable
                    style={styles.removeAttachment}
                    onPress={() => setAttachmentUrl(null)}
                    accessibilityRole="button"
                    accessibilityLabel="Remove image"
                    hitSlop={10}
                  >
                    <Ionicons name="close" size={14} color={AppTheme.colors.white} />
                  </Pressable>
                </View>
                <Pressable style={styles.removeAttachmentRow} onPress={() => setAttachmentUrl(null)}>
                  <Ionicons name="trash-outline" size={14} color={AppTheme.colors.danger} />
                  <AppText variant="small" tone="primary">
                    Remove image
                  </AppText>
                </Pressable>
              </View>
            ) : null}
            {error ? (
              <AppText variant="small" style={{ color: AppTheme.colors.danger }}>
                {error}
              </AppText>
            ) : null}
            {helperText ? (
              <AppText variant="small" tone="soft" style={styles.helper}>
                {helperText}
              </AppText>
            ) : null}
            <View style={styles.composerRow}>
              <Pressable onPress={() => void handlePickImage()} style={styles.attachButton} disabled={uploading}>
                <Ionicons name="image-outline" size={16} color={AppTheme.colors.primary} />
                <AppText variant="small" tone="primary">
                  {uploading ? 'Uploading' : 'Image'}
                </AppText>
              </Pressable>
              <Pressable onPress={() => setDraft('')} style={styles.clearButton}>
                <Ionicons name="trash-outline" size={16} color={AppTheme.colors.primary} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => void handleSend()}
                disabled={sending}
                style={({ pressed }) => [
                  styles.sendButton,
                  pressed && !sending ? styles.sendButtonPressed : null,
                  sending ? styles.sendButtonLoading : null
                ]}
              >
                <AppText variant="label" tone="white">
                  {sending ? 'Sending...' : 'Send'}
                </AppText>
              </Pressable>
            </View>
          </SectionCard>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: AppTheme.spacing.md,
    gap: AppTheme.spacing.md,
    paddingBottom: AppTheme.spacing.lg
  },
  hero: {
    gap: AppTheme.spacing.sm
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.md
  },
  heroActions: {
    marginTop: AppTheme.spacing.sm,
    gap: AppTheme.spacing.sm
  },
  heroAvatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.primaryContainer,
    overflow: 'hidden'
  },
  heroAvatarImage: {
    width: '100%',
    height: '100%'
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: AppTheme.radius.pill
  },
  statusprimary: {
    backgroundColor: AppTheme.colors.primary
  },
  statusinfo: {
    backgroundColor: AppTheme.colors.info
  },
  statussuccess: {
    backgroundColor: AppTheme.colors.success
  },
  statusdanger: {
    backgroundColor: AppTheme.colors.danger
  },
  heroStrip: {
    flexDirection: 'row'
  },
  listContent: {
    gap: AppTheme.spacing.sm,
    paddingBottom: AppTheme.spacing.sm + 12
  },
  messagesList: {
    flex: 1
  },
  bubbleRow: {
    flexDirection: 'row'
  },
  systemRow: {
    justifyContent: 'center'
  },
  mineRow: {
    justifyContent: 'flex-end'
  },
  theirRow: {
    justifyContent: 'flex-start'
  },
  bubble: {
    maxWidth: '86%',
    borderRadius: 20,
    padding: AppTheme.spacing.md,
    gap: 4
  },
  mineBubble: {
    backgroundColor: AppTheme.colors.primary
  },
  theirBubble: {
    backgroundColor: AppTheme.colors.surface
  },
  systemBubble: {
    backgroundColor: AppTheme.colors.primaryContainer + '70',
    alignItems: 'center'
  },
  sender: {
    fontWeight: '700'
  },
  messageText: {
    lineHeight: 22
  },
  timeText: {
    marginTop: 2
  },
  systemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6
  },
  systemLabel: {
    fontWeight: '700'
  },
  attachmentWrap: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  localStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2
  },
  localStatusText: {
    fontSize: 11
  },
  attachmentImage: {
    width: 220,
    height: 160
  },
  emptyState: {
    alignItems: 'center',
    gap: AppTheme.spacing.sm,
    paddingVertical: AppTheme.spacing.xl
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.primaryContainer
  },
  emptyTitle: {
    textAlign: 'center'
  },
  emptySubtitle: {
    textAlign: 'center',
    maxWidth: 300
  },
  composerCard: {
    gap: AppTheme.spacing.sm
  },
  composerInputWrap: {
    borderRadius: AppTheme.radius.md,
    backgroundColor: AppTheme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  composerInput: {
    minHeight: 96,
    paddingHorizontal: AppTheme.spacing.md,
    paddingTop: AppTheme.spacing.md,
    color: AppTheme.colors.text
  },
  attachmentPreviewCard: {
    position: 'relative',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  attachmentPreviewBlock: {
    gap: AppTheme.spacing.xs
  },
  attachmentPreview: {
    width: '100%',
    height: 180
  },
  removeAttachment: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)'
  },
  removeAttachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 2
  },
  helper: {
    marginTop: -4
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.sm,
    justifyContent: 'space-between'
  },
  attachButton: {
    minHeight: 42,
    minWidth: 96,
    paddingHorizontal: AppTheme.spacing.md,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AppTheme.colors.primaryContainer
  },
  clearButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  sendButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.primaryStrong
  },
  sendButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }]
  },
  sendButtonLoading: {
    opacity: 0.78
  }
});

