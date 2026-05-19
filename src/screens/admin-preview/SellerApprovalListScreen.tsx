import React from 'react';
import { FlatList, Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/common/Screen';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppText } from '@/components/common/AppText';
import { AppButton } from '@/components/common/AppButton';
import { AppTheme } from '@/theme';
import { useGetSellerApprovalsQuery, useReviewSellerApprovalMutation } from '@/store/api/adminApi';
import { showFeedback } from '@/store/slices/feedbackSlice';
import { useAppDispatch } from '@/store/hooks';
import { executeWithOfflineQueue } from '@/services/offlineQueue';

type DetailItem = { label: string; value: string };
type DetailDoc = { label: string; url: string };

const getNoteValue = (note: string | undefined | null, label: string) => {
  if (!note) return '';
  const match = note.match(new RegExp(`${label}:\\s*([^|\\n]+)`, 'i'));
  return match?.[1]?.trim() ?? '';
};

const buildApplicationDetails = (item: any): { summary: DetailItem[]; documents: DetailDoc[] } => {
  const ownerName = item.ownerName || getNoteValue(item.note, 'Owner') || item.user?.name || 'N/A';
  const applicantPhone = item.applicantPhone || getNoteValue(item.note, 'Phone') || item.user?.phone || 'N/A';
  const applicantEmail = item.applicantEmail || getNoteValue(item.note, 'Email') || item.user?.email || 'N/A';
  const city = item.city || getNoteValue(item.note, 'City') || 'N/A';
  const bankAccount = item.bankAccount || getNoteValue(item.note, 'Bank Account') || 'N/A';
  const ifsc = item.ifsc || getNoteValue(item.note, 'IFSC') || 'N/A';

  const summary = [
    { label: 'Owner name', value: ownerName },
    { label: 'Seller phone', value: applicantPhone },
    { label: 'Email', value: applicantEmail },
    { label: 'City / address', value: city },
    { label: 'Store name', value: item.storeName ?? 'N/A' },
    { label: 'Category', value: item.category ?? 'N/A' },
    { label: 'GST number', value: item.gstNumber ?? 'Not provided' },
    { label: 'Bank last 4', value: item.bankLast4 ? `•••• ${item.bankLast4}` : 'Pending' },
    { label: 'Bank account', value: bankAccount },
    { label: 'IFSC', value: ifsc },
    { label: 'Application status', value: item.status ?? 'PENDING' },
    { label: 'Admin note', value: item.note?.trim() || 'No note added yet' }
  ];

  const documents = [
    { label: 'Aadhaar front', url: item.aadhaarFrontUrl },
    { label: 'Aadhaar back', url: item.aadhaarBackUrl },
    { label: 'PAN card', url: item.panCardUrl },
    { label: 'GST certificate', url: item.gstCertificateUrl },
    { label: 'Bank proof', url: item.bankProofUrl },
    { label: 'Address proof', url: item.addressProofUrl }
  ].filter((doc): doc is DetailDoc => Boolean(doc.url));

  return { summary, documents };
};

export function SellerApprovalListScreen() {
  const dispatch = useAppDispatch();
  const { data, isLoading, isFetching, refetch } = useGetSellerApprovalsQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true
  });
  const [reviewSellerApproval] = useReviewSellerApprovalMutation();
  const [pendingAction, setPendingAction] = React.useState<{ id: string; status: 'APPROVED' | 'REJECTED' } | null>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const approvals = data?.data ?? data ?? [];

  const decide = (id: string, status: 'APPROVED' | 'REJECTED') => {
    const body = { status, note: status === 'REJECTED' ? 'Reviewed in admin panel.' : 'Approved via admin panel.' };
    setPendingAction({ id, status });
    void executeWithOfflineQueue({
      type: 'admin.reviewSellerApproval',
      payload: { id, body },
      action: () => reviewSellerApproval({ id, ...body }).unwrap()
    })
      .then((result) => {
        dispatch(showFeedback({
          type: result.queued ? 'info' : 'success',
          title: `Seller ${status.toLowerCase()}`,
          message: result.queued ? 'Saved offline. It will sync automatically.' : 'Marketplace decision saved.'
        }));
      })
      .catch((error: any) => {
        dispatch(showFeedback({
          type: 'error',
          title: 'Action failed',
          message: error?.body?.error ?? error?.data?.message ?? error?.message ?? 'Please try again.'
        }));
      })
      .finally(() => {
        setPendingAction((current) => (current?.id === id && current?.status === status ? null : current));
      });
  };

  return (
    <Screen>
      <FlatList
        data={approvals}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.content}
        refreshing={isLoading || isFetching}
        onRefresh={refetch}
        ListHeaderComponent={<PageHeader title="Seller Approval Queue" subtitle="Review seller applications with document previews." />}
        ListEmptyComponent={
          <SectionCard style={styles.emptyCard}>
            <Ionicons name="checkmark-done-outline" size={30} color={AppTheme.colors.primary} />
            <AppText variant="headline" style={{ marginTop: 12 }}>No pending approvals</AppText>
            <AppText variant="body" tone="soft" style={styles.centerText}>New seller applications will appear here.</AppText>
          </SectionCard>
        }
        renderItem={({ item }: any) => {
          const parsed = buildApplicationDetails(item);
          const isBusy = pendingAction?.id === item.id;
          const isExpanded = expandedId === item.id;
          const isApproved = item.status === 'APPROVED';
          const isRejected = item.status === 'REJECTED';
          const isPending = item.status === 'PENDING';

          return (
            <SectionCard style={styles.card}>
              <View style={styles.rowTop}>
                <View style={styles.iconWrap}>
                  <Ionicons name="storefront-outline" size={22} color={AppTheme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.metaRow}>
                  <AppText variant="title">{item.storeName}</AppText>
                    <View style={styles.statusPill}>
                      <AppText variant="small" tone="white">{item.status}</AppText>
                    </View>
                  </View>
                  <AppText variant="body" tone="soft">{item.category}</AppText>
                  <AppText variant="small" tone="soft">
                    Submitted by: {item.user?.name ?? item.user?.phone ?? 'Unknown'}{item.user?.email ? ` • ${item.user.email}` : ''}
                  </AppText>
                  <AppText variant="small" tone="soft">Seller phone: {item.applicantPhone ?? item.user?.phone ?? 'N/A'}</AppText>
                  <AppText variant="small" tone="soft">Submitted: {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A'}</AppText>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={[styles.infoCard, styles.infoWarm]}>
                  <AppText variant="small" tone="soft">GST</AppText>
                  <AppText variant="label">{item.gstNumber ?? 'Optional'}</AppText>
                </View>
                <View style={[styles.infoCard, styles.infoBlue]}>
                  <AppText variant="small" tone="soft">Bank</AppText>
                  <AppText variant="label">{item.bankLast4 ? `•••• ${item.bankLast4}` : 'Pending'}</AppText>
                </View>
              </View>

              <View style={styles.topActionRow}>
                <AppButton
                  title={isExpanded ? 'Hide details' : 'View details'}
                  variant="secondary"
                  onPress={() => setExpandedId((current) => (current === item.id ? null : item.id))}
                  style={styles.actionButton}
                />
                {!isPending ? (
                  <View style={[styles.reviewedPill, isApproved ? styles.reviewApproved : styles.reviewRejected]}>
                    <AppText variant="small" tone="white">{item.status}</AppText>
                  </View>
                ) : null}
              </View>

              {isExpanded ? (
                <View style={styles.detailStack}>
                  <View style={styles.detailGroup}>
                    <AppText variant="label" tone="soft">Application details</AppText>
                    <View style={styles.detailGrid}>
                      {parsed.summary.map((entry) => (
                        <View key={`${entry.label}-${entry.value}`} style={styles.detailChip}>
                          <AppText variant="small" tone="soft">{entry.label}</AppText>
                          <AppText variant="label">{entry.value}</AppText>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.detailGroup}>
                    <AppText variant="label" tone="soft">Documents</AppText>
                    {parsed.documents.length ? (
                      <View style={styles.documentGrid}>
                        {parsed.documents.map((doc) => (
                          <View key={`${doc.label}-${doc.url}`} style={styles.documentCard}>
                            <Image source={{ uri: doc.url }} style={styles.documentImage} resizeMode="cover" />
                            <View style={styles.documentFooter}>
                              <AppText variant="label" numberOfLines={1}>{doc.label}</AppText>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <SectionCard style={styles.emptyDocsCard}>
                        <AppText variant="body" tone="soft">No documents uploaded for this application.</AppText>
                      </SectionCard>
                    )}
                  </View>
                </View>
              ) : null}

              <View style={styles.actionRow}>
                <AppButton
                  title={isBusy && pendingAction?.status === 'APPROVED' ? 'Approving...' : isApproved ? 'Approved' : 'Approve'}
                  onPress={() => decide(item.id, 'APPROVED')}
                  loading={isBusy && pendingAction?.status === 'APPROVED'}
                  style={styles.actionButton}
                  variant={isApproved ? 'secondary' : 'primary'}
                  disabled={isBusy || isApproved}
                />
                <AppButton
                  title={isBusy && pendingAction?.status === 'REJECTED' ? 'Rejecting...' : isRejected ? 'Rejected' : 'Reject'}
                  variant="secondary"
                  onPress={() => decide(item.id, 'REJECTED')}
                  loading={isBusy && pendingAction?.status === 'REJECTED'}
                  style={styles.actionButton}
                  disabled={isBusy || isRejected}
                />
              </View>
            </SectionCard>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: AppTheme.spacing.md,
    gap: AppTheme.spacing.md,
    paddingBottom: AppTheme.spacing.xl
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: AppTheme.spacing.xl
  },
  centerText: {
    textAlign: 'center',
    marginTop: 8
  },
  card: {
    gap: AppTheme.spacing.md
  },
  rowTop: {
    flexDirection: 'row',
    gap: AppTheme.spacing.md
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.primaryContainer
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: AppTheme.spacing.sm
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: AppTheme.radius.pill,
    backgroundColor: AppTheme.colors.primary
  },
  infoRow: {
    flexDirection: 'row',
    gap: AppTheme.spacing.sm
  },
  infoCard: {
    flex: 1,
    padding: AppTheme.spacing.md,
    borderRadius: AppTheme.radius.md,
    gap: 4
  },
  infoWarm: {
    backgroundColor: '#FFF3EC'
  },
  infoBlue: {
    backgroundColor: '#EEF6FF'
  },
  topActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.sm
  },
  actionRow: {
    flexDirection: 'row',
    gap: AppTheme.spacing.sm
  },
  actionButton: {
    flex: 1
  },
  reviewedPill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: AppTheme.radius.pill
  },
  reviewApproved: {
    backgroundColor: AppTheme.colors.success
  },
  reviewRejected: {
    backgroundColor: AppTheme.colors.danger
  },
  detailStack: {
    gap: AppTheme.spacing.md
  },
  detailGroup: {
    gap: AppTheme.spacing.sm
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppTheme.spacing.sm
  },
  detailChip: {
    minWidth: '46%',
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: AppTheme.radius.md,
    backgroundColor: AppTheme.colors.surfaceSoft,
    gap: 4
  },
  documentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppTheme.spacing.sm
  },
  documentCard: {
    width: '48%',
    minWidth: 150,
    flexGrow: 1,
    borderRadius: AppTheme.radius.md,
    overflow: 'hidden',
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  emptyDocsCard: {
    padding: AppTheme.spacing.md,
    borderRadius: AppTheme.radius.md,
    backgroundColor: AppTheme.colors.surfaceSoft
  },
  documentImage: {
    width: '100%',
    height: 128,
    backgroundColor: AppTheme.colors.surfaceWarm
  },
  documentFooter: {
    paddingHorizontal: 10,
    paddingVertical: 8
  }
});
