import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { AppText } from '@/components/common/AppText';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppTheme } from '@/theme';
import { ROUTES } from '@/constants/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { getAuthSession } from '@/services/tokenStorage';
import { useMySupportThreadQuery } from '@/store/api/supportApi';

export function HelpSupportScreen({ navigation }: any) {
  const { sessionReady } = useAuthContext();
  const tokenReady = Boolean(getAuthSession()?.token);
  const { data: thread } = useMySupportThreadQuery(undefined, {
    skip: !sessionReady || !tokenReady,
    refetchOnMountOrArgChange: true
  });

  const supportMessages = thread?.messages ?? [];
  const lastMessage = supportMessages[supportMessages.length - 1];
  const isOrderLinkedThread = Boolean(
    thread?.orderId || thread?.orderNumberSnapshot || thread?.orderItemId || thread?.orderItemTitleSnapshot
  );
  const hasGeneralConversation = (supportMessages.length > 0 || Boolean(thread?.id)) && !isOrderLinkedThread;

  const openSupportChat = () => {
    if (thread?.id && !isOrderLinkedThread) {
      navigation.navigate(ROUTES.SupportChat, {
        composeOnly: false,
        scope: 'GENERAL',
        threadId: thread.id
      });
      return;
    }
    navigation.navigate(ROUTES.SupportChat, { composeOnly: false, scope: 'GENERAL' });
  };

  const continueSupportChat = () => {
    navigation.navigate(ROUTES.SupportChat, {
      composeOnly: false,
      scope: 'GENERAL',
      threadId: thread?.id ?? undefined
    });
  };

  return (
    <Screen>
      <PageHeader title="Help & Support" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionCard style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <MaterialCommunityIcons name="headset" size={24} color={AppTheme.colors.primary} />
            </View>
          </View>

          {hasGeneralConversation ? (
            <Pressable style={styles.threadCard} onPress={continueSupportChat}>
              <View style={styles.threadRow}>
                <View style={styles.threadIcon}>
                  <Ionicons name="chatbubble-outline" size={18} color={AppTheme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="title">Your support thread</AppText>
                  <AppText variant="small" tone="soft">
                    {thread?.status ?? 'OPEN'} | {thread?.subject ?? 'Support request'}
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={AppTheme.colors.primary} />
              </View>
              <AppText variant="body" tone="soft">
                {lastMessage?.message ?? 'Tap to continue your existing support chat.'}
              </AppText>
            </Pressable>
          ) : isOrderLinkedThread ? (
            <SectionCard style={styles.threadCard}>
              <View style={styles.threadRow}>
                <View style={styles.threadIcon}>
                  <Ionicons name="document-text-outline" size={18} color={AppTheme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="title">Order support lives inside the order</AppText>
                  <AppText variant="small" tone="soft">
                    Open the order details screen to continue return, replacement, or order-specific help.
                  </AppText>
                </View>
              </View>
            </SectionCard>
          ) : null}
        </SectionCard>
      </ScrollView>
      <Pressable style={styles.chatFab} onPress={openSupportChat} accessibilityRole="button">
        <Ionicons name="chatbubble-outline" size={24} color={AppTheme.colors.white} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: AppTheme.spacing.md,
    gap: AppTheme.spacing.md,
    paddingBottom: AppTheme.spacing.xl + 140
  },
  heroCard: {
    gap: AppTheme.spacing.md
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.md
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.primaryContainer
  },
  threadCard: {
    gap: AppTheme.spacing.sm,
    paddingVertical: AppTheme.spacing.md
  },
  threadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.md
  },
  threadIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.primaryContainer
  },
  chatFab: {
    position: 'absolute',
    right: AppTheme.spacing.md,
    bottom: AppTheme.spacing.lg,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.primary,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6
  }
});
