// src/screens/MqttScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'mqttConfig';

const MqttScreen: React.FC = () => {
  const [host, setHost] = useState('');
  const [port, setPort] = useState('9001');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [baseTopic, setBaseTopic] = useState('');
  const [saving, setSaving] = useState(false);

  // подгружаем сохранённый конфиг (если есть)
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (json) {
          const cfg = JSON.parse(json);
          setHost(cfg.host ?? '');
          setPort(cfg.port ?? '9001');
          setUsername(cfg.username ?? '');
          setPassword(cfg.password ?? '');
          setBaseTopic(cfg.baseTopic ?? '');
        }
      } catch (e) {
        console.warn('LOAD MQTT CONFIG ERROR', e);
      }
    };

    loadConfig();
  }, []);

  const handleSave = async () => {
    const config = { host, port, username, password, baseTopic };

    try {
      setSaving(true);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      console.log('MQTT CONFIG SAVED', config);
    } catch (e) {
      console.warn('SAVE MQTT CONFIG ERROR', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>MQTT settings</Text>
        <Text style={styles.subtitle}>
          Configure broker connection. These values will be used on app start.
        </Text>

        <FormField
          label="Host"
          value={host}
          onChangeText={setHost}
          placeholder="mqtt.example.com"
        />
        <FormField
          label="Port"
          value={port}
          onChangeText={setPort}
          keyboardType="numeric"
          placeholder="9001"
        />
        <FormField
          label="Username"
          value={username}
          onChangeText={setUsername}
          placeholder="mqtt-user"
        />
        <FormField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="********"
          secureTextEntry
        />
        <FormField
          label="Base topic"
          value={baseTopic}
          onChangeText={setBaseTopic}
          placeholder="tv/media"
        />

        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save config'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
  secureTextEntry?: boolean;
};

const FormField: React.FC<FieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry,
}) => {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
};

export default MqttScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 80,
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6', // можно поменять, если нужен другой фон
  },
  card: {
    width: '100%',
    maxWidth: 960,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 40,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  field: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  input: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#111827',
  },
  saveButton: {
    marginTop: 12,
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#2563EB',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
