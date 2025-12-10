import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'mqttConfig';

const MqttScreen: React.FC = () => {
  const [host, setHost] = useState('');
  const [port, setPort] = useState('9001');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [baseTopic, setBaseTopic] = useState('');
  const [saving, setSaving] = useState(false);

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
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Text style={styles.title}>MQTT settings</Text>

          <View style={styles.form}>
            {/* Row 1: Host / Port */}
            <View style={styles.row}>
              <View style={styles.column}>
                <FormField
                  label="Host"
                  value={host}
                  onChangeText={setHost}
                  placeholder="mqtt.example.com"
                />
              </View>
              <View style={styles.column}>
                <FormField
                  label="Port"
                  value={port}
                  onChangeText={setPort}
                  keyboardType="numeric"
                  placeholder="9001"
                />
              </View>
            </View>

            {/* Row 2: Username / Password */}
            <View style={styles.row}>
              <View style={styles.column}>
                <FormField
                  label="Username"
                  value={username}
                  onChangeText={setUsername}
                  placeholder="mqtt-user"
                />
              </View>
              <View style={styles.column}>
                <FormField
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="********"
                  secureTextEntry
                />
              </View>
            </View>

            {/* Row 3: Base topic (только слева, той же ширины, справа пусто) */}
            <View style={styles.row}>
              <View style={styles.column}>
                <FormField
                  label="Base topic"
                  value={baseTopic}
                  onChangeText={setBaseTopic}
                  placeholder="tv/media"
                />
              </View>
              <View style={styles.column} />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}>
              <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save config'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
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
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingLeft: 24,
    paddingTop: 20,
    paddingRight: 40,
    paddingBottom: 40,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'left',
    marginBottom: 18,
  },
  form: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    columnGap: 16, // расстояние между колонками
    marginBottom: 12,
  },
  column: {
    flex: 1, // обе колонки в строке одинаковой ширины
  },
  field: {
    // без flex здесь, иначе Base topic опять растянется
  },
  fieldLabel: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 4,
  },
  input: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#111827',
  },
  saveButton: {
    marginTop: 14,
    alignSelf: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#2563EB',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
