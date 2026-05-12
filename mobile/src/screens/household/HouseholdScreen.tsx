/**
 * Household Screen - Manage family members and service providers.
 * Shows members with roles/skills and providers with contact info.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, useTheme } from '../../theme/theme';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import PrimaryButton from '../../components/PrimaryButton';
import { useToast } from '../../components/Toast';
import { apiService } from '../../services/api';
import type { HouseholdMember, ExternalProvider } from '../../types';

const roleIcons: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  parent: 'person',
  partner: 'favorite',
  nanny: 'child-care',
  grandparent: 'elderly',
  other: 'person-outline',
};

const HouseholdScreen: React.FC = () => {
  const theme = useTheme();
  const toast = useToast();
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [providers, setProviders] = useState<ExternalProvider[]>([]);
  const [loading, setLoading] = useState(true);

  // Add member form
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('parent');
  const [newMemberSkills, setNewMemberSkills] = useState('');

  // Add provider form
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [newProviderName, setNewProviderName] = useState('');
  const [newProviderType, setNewProviderType] = useState('');
  const [newProviderPhone, setNewProviderPhone] = useState('');

  const loadHousehold = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.getHousehold();
      setMembers(data.members);
      setProviders(data.providers);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadHousehold(); }, [loadHousehold]);

  const handleAddMember = useCallback(async () => {
    if (!newMemberName.trim()) { toast.error('Name is required'); return; }
    try {
      const member = await apiService.addHouseholdMember({
        name: newMemberName.trim(),
        role: newMemberRole,
        skills: newMemberSkills.split(',').map((s) => s.trim()).filter(Boolean),
        isExternal: newMemberRole === 'nanny',
      });
      setMembers((prev) => [...prev, member]);
      setNewMemberName('');
      setNewMemberSkills('');
      setShowAddMember(false);
      toast.success(`${member.name} added to household.`);
    } catch { toast.error('Could not add member.'); }
  }, [newMemberName, newMemberRole, newMemberSkills, toast]);

  const handleRemoveMember = useCallback(async (id: string) => {
    try {
      await apiService.removeHouseholdMember(id);
      setMembers((prev) => prev.filter((m) => m.id !== id));
      toast.info('Member removed.');
    } catch { toast.error('Could not remove member.'); }
  }, [toast]);

  const handleAddProvider = useCallback(async () => {
    if (!newProviderName.trim() || !newProviderType.trim()) {
      toast.error('Name and type are required');
      return;
    }
    try {
      const provider = await apiService.addServiceProvider({
        name: newProviderName.trim(),
        serviceType: newProviderType.trim(),
        phone: newProviderPhone.trim() || undefined,
      });
      setProviders((prev) => [...prev, provider]);
      setNewProviderName('');
      setNewProviderType('');
      setNewProviderPhone('');
      setShowAddProvider(false);
      toast.success(`${provider.name} added.`);
    } catch { toast.error('Could not add provider.'); }
  }, [newProviderName, newProviderType, newProviderPhone, toast]);

  const handleRemoveProvider = useCallback(async (id: string) => {
    try {
      await apiService.removeServiceProvider(id);
      setProviders((prev) => prev.filter((p) => p.id !== id));
      toast.info('Provider removed.');
    } catch { toast.error('Could not remove provider.'); }
  }, [toast]);

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={[styles.pageTitle, { fontFamily: theme.typography.fontFamily.bold }]}>
          Household
        </Text>
        <Text style={[styles.pageSubtitle, { fontFamily: theme.typography.fontFamily.regular }]}>
          Manage your family members and service providers for smarter delegation.
        </Text>

        {/* Family Members */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { fontFamily: theme.typography.fontFamily.semibold }]}>
            Family members
          </Text>
          <TouchableOpacity onPress={() => setShowAddMember(!showAddMember)} activeOpacity={0.7}>
            <MaterialIcons name={showAddMember ? 'close' : 'person-add'} size={20} color={colors.gray[600]} />
          </TouchableOpacity>
        </View>

        {showAddMember && (
          <Card style={styles.formCard}>
            <TextInput
              style={[styles.input, { fontFamily: theme.typography.fontFamily.regular }]}
              placeholder="Name"
              placeholderTextColor={colors.gray[400]}
              value={newMemberName}
              onChangeText={setNewMemberName}
            />
            <View style={styles.roleRow}>
              {['parent', 'partner', 'nanny', 'grandparent'].map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[styles.roleChip, newMemberRole === role && styles.roleChipSelected]}
                  onPress={() => setNewMemberRole(role)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.roleChipText,
                    newMemberRole === role && styles.roleChipTextSelected,
                    { fontFamily: theme.typography.fontFamily.medium },
                  ]}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.input, { fontFamily: theme.typography.fontFamily.regular }]}
              placeholder="Skills (comma-separated: cooking, tech, childcare)"
              placeholderTextColor={colors.gray[400]}
              value={newMemberSkills}
              onChangeText={setNewMemberSkills}
            />
            <PrimaryButton label="Add member" icon="person-add" onPress={handleAddMember} />
          </Card>
        )}

        {members.length === 0 && !showAddMember ? (
          <Card>
            <View style={styles.emptyState}>
              <MaterialIcons name="people" size={32} color={colors.gray[300]} />
              <Text style={[styles.emptyText, { fontFamily: theme.typography.fontFamily.regular }]}>
                Add family members so the AI can suggest delegation.
              </Text>
            </View>
          </Card>
        ) : (
          members.map((member) => (
            <Card key={member.id} style={styles.memberCard}>
              <View style={styles.memberRow}>
                <View style={styles.memberIcon}>
                  <MaterialIcons
                    name={roleIcons[member.role] || 'person'}
                    size={20}
                    color={colors.gray[700]}
                  />
                </View>
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { fontFamily: theme.typography.fontFamily.semibold }]}>
                    {member.name}
                  </Text>
                  <Text style={[styles.memberRole, { fontFamily: theme.typography.fontFamily.regular }]}>
                    {member.role}{member.isExternal ? ' (external)' : ''}
                  </Text>
                  {member.skills.length > 0 && (
                    <View style={styles.skillsRow}>
                      {member.skills.map((skill, i) => (
                        <View key={i} style={styles.skillBadge}>
                          <Text style={[styles.skillText, { fontFamily: theme.typography.fontFamily.medium }]}>
                            {skill}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                <TouchableOpacity onPress={() => handleRemoveMember(member.id!)} activeOpacity={0.7}>
                  <MaterialIcons name="close" size={18} color={colors.gray[400]} />
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}

        {/* Service Providers */}
        <View style={[styles.sectionHeader, { marginTop: spacing.lg }]}>
          <Text style={[styles.sectionLabel, { fontFamily: theme.typography.fontFamily.semibold }]}>
            Service providers
          </Text>
          <TouchableOpacity onPress={() => setShowAddProvider(!showAddProvider)} activeOpacity={0.7}>
            <MaterialIcons name={showAddProvider ? 'close' : 'add-business'} size={20} color={colors.gray[600]} />
          </TouchableOpacity>
        </View>

        {showAddProvider && (
          <Card style={styles.formCard}>
            <TextInput
              style={[styles.input, { fontFamily: theme.typography.fontFamily.regular }]}
              placeholder="Provider name"
              placeholderTextColor={colors.gray[400]}
              value={newProviderName}
              onChangeText={setNewProviderName}
            />
            <TextInput
              style={[styles.input, { fontFamily: theme.typography.fontFamily.regular }]}
              placeholder="Type (e.g. pediatrician, plumber, babysitter)"
              placeholderTextColor={colors.gray[400]}
              value={newProviderType}
              onChangeText={setNewProviderType}
            />
            <TextInput
              style={[styles.input, { fontFamily: theme.typography.fontFamily.regular }]}
              placeholder="Phone (optional)"
              placeholderTextColor={colors.gray[400]}
              value={newProviderPhone}
              onChangeText={setNewProviderPhone}
              keyboardType="phone-pad"
            />
            <PrimaryButton label="Add provider" icon="add-business" onPress={handleAddProvider} />
          </Card>
        )}

        {providers.length === 0 && !showAddProvider ? (
          <Card>
            <View style={styles.emptyState}>
              <MaterialIcons name="business" size={32} color={colors.gray[300]} />
              <Text style={[styles.emptyText, { fontFamily: theme.typography.fontFamily.regular }]}>
                Add pediatricians, plumbers, babysitters, and other service providers.
              </Text>
            </View>
          </Card>
        ) : (
          providers.map((provider) => (
            <Card key={provider.id} style={styles.memberCard}>
              <View style={styles.memberRow}>
                <View style={[styles.memberIcon, { backgroundColor: colors.info + '15' }]}>
                  <MaterialIcons name="business" size={18} color={colors.info} />
                </View>
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { fontFamily: theme.typography.fontFamily.semibold }]}>
                    {provider.name}
                  </Text>
                  <Text style={[styles.memberRole, { fontFamily: theme.typography.fontFamily.regular }]}>
                    {provider.serviceType}
                    {provider.phone ? ` \u00B7 ${provider.phone}` : ''}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleRemoveProvider(provider.id!)} activeOpacity={0.7}>
                  <MaterialIcons name="close" size={18} color={colors.gray[400]} />
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingTop: spacing.md, paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.gray[900], letterSpacing: -0.3 },
  pageSubtitle: { fontSize: typography.sizes.sm, color: colors.gray[500], marginTop: spacing.xs, marginBottom: spacing.lg, lineHeight: 19 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionLabel: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, color: colors.gray[500], textTransform: 'uppercase', letterSpacing: 0.8 },

  formCard: { marginBottom: spacing.md },
  input: { borderWidth: 1, borderColor: colors.gray[200], borderRadius: 10, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, fontSize: typography.sizes.sm, color: colors.gray[900], backgroundColor: colors.gray[50], marginBottom: spacing.sm },
  roleRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm, flexWrap: 'wrap' },
  roleChip: { paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs + 2, borderRadius: 8, borderWidth: 1.5, borderColor: colors.gray[200], backgroundColor: colors.gray[50] },
  roleChipSelected: { backgroundColor: colors.gray[900], borderColor: colors.gray[900] },
  roleChipText: { fontSize: typography.sizes.xs, color: colors.gray[700] },
  roleChipTextSelected: { color: '#FFFFFF' },

  emptyState: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm },
  emptyText: { fontSize: typography.sizes.sm, color: colors.gray[500], textAlign: 'center', lineHeight: 19 },

  memberCard: { marginBottom: spacing.sm },
  memberRow: { flexDirection: 'row', alignItems: 'center' },
  memberIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.gray[100], alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  memberInfo: { flex: 1 },
  memberName: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.gray[900] },
  memberRole: { fontSize: typography.sizes.xs, color: colors.gray[500], marginTop: 1 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  skillBadge: { backgroundColor: colors.info + '12', paddingHorizontal: spacing.xs + 2, paddingVertical: 2, borderRadius: 4 },
  skillText: { fontSize: 10, color: colors.info },
});

export default HouseholdScreen;
