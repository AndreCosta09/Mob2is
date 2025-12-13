import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { UserContext } from '../context/UserContext';

const CONDITIONS = [
  { id: 'visual', label: 'DEFICIÊNCIA VISUAL', color: '#FF6B6B', icon: '👁️' },
  { id: 'wheelchair', label: 'CADEIRA DE RODAS', color: '#A2D76B', icon: '♿' },
  { id: 'hearing', label: 'DEFICIÊNCIA AUDITIVA', color: '#A890F0', icon: '👂' },
  { id: 'autism', label: 'ESPECTRO DE AUTISMO (PEA)', color: '#FFD764', icon: '🧠' },
  { id: 'strollers', label: 'GRÁVIDAS, CRIANÇAS E CARRINHOS', color: '#FF7A8A', icon: '🤰' },
  { id: 'elderly', label: 'IDOSO COM MOBILIDADE CONDICIONADA', color: '#6BCBE1', icon: '👴' },
];

export default function OnboardingScreen() {
  const { saveCondition } = useContext(UserContext);
  const [selected, setSelected] = useState(null);

  const handleStart = () => {
    if (selected) saveCondition(selected);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Qual é a sua condição?</Text>
        </View>
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {CONDITIONS.map((item) => {
            const isSelected = selected === item.id;
            return (
              <TouchableOpacity key={item.id} style={[styles.card, isSelected && { backgroundColor: item.color, borderColor: item.color }]} onPress={() => setSelected(item.id)} activeOpacity={0.9}>
                <View style={[styles.iconBox, { backgroundColor: item.color }]}>
                  <Text style={{fontSize: 20}}>{item.icon}</Text>
                </View>
                <Text style={[styles.label, isSelected && styles.selectedLabel]}>{item.label}</Text>
                <View style={[styles.radio, isSelected && { borderColor: '#FFF' }]}>
                  {isSelected && <View style={[styles.radioFill, { backgroundColor: '#FFF' }]} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.button, !selected && styles.buttonDisabled]} onPress={handleStart} disabled={!selected}>
            <Text style={styles.buttonText}>Iniciar Rota</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#EFEFEF' },
  container: { flex: 1, padding: 20 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#002E5D', textAlign: 'center' },
  list: { paddingBottom: 20 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 15, marginBottom: 15, borderWidth: 2, borderColor: 'transparent', elevation: 2 },
  iconBox: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  label: { flex: 1, fontSize: 13, fontWeight: '700', color: '#333', textTransform: 'uppercase' },
  selectedLabel: { color: '#FFF' },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#CCC', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  radioFill: { width: 14, height: 14, borderRadius: 7 },
  footer: { paddingVertical: 20 },
  button: { backgroundColor: '#F18F01', padding: 18, borderRadius: 12, alignItems: 'center', elevation: 3 },
  buttonDisabled: { backgroundColor: '#CCC', elevation: 0 },
  buttonText: { color: '#002E5D', fontWeight: 'bold', fontSize: 20 }
});