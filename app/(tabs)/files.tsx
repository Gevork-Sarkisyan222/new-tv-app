// src/screens/FilesScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ListRenderItem,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

type FileItem = {
  uri: string;
  name: string;
  size: string;
};

const MEDIA_DIR = FileSystem.documentDirectory + 'media/';

const FilesScreen: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // при первом открытии создаём папку media и читаем файлы
  useEffect(() => {
    const init = async () => {
      try {
        const dirInfo = await FileSystem.getInfoAsync(MEDIA_DIR);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(MEDIA_DIR, { intermediates: true });
        }
        await loadFiles();
      } catch (e) {
        console.warn('INIT MEDIA DIR ERROR', e);
        setError('Failed to initialize media directory');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const loadFiles = async () => {
    try {
      const names = await FileSystem.readDirectoryAsync(MEDIA_DIR);
      const items: FileItem[] = [];

      for (const name of names) {
        const uri = MEDIA_DIR + name;
        const info = await FileSystem.getInfoAsync(uri);
        let sizeLabel = '';
        if (info?.exists && info?.size != null) {
          const sizeMB = info.size / (1024 * 1024);
          sizeLabel = `${sizeMB.toFixed(1)} MB`;
        }
        items.push({ uri, name, size: sizeLabel });
      }

      setFiles(items);
    } catch (e) {
      console.warn('LOAD FILES ERROR', e);
      setError('Failed to load files list');
    }
  };

  const handleDelete = async (uri: string) => {
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
      await loadFiles();
    } catch (e) {
      console.warn('DELETE FILE ERROR', e);
      setError('Failed to delete file');
    }
  };

  const handleDownload = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    setError(null);

    // имя файла из URL
    let fileName = trimmed.split('/').pop() || `file_${Date.now()}`;
    fileName = fileName.split('?')[0];

    const dest = MEDIA_DIR + fileName;

    try {
      setDownloading(true);

      const result = await FileSystem.downloadAsync(trimmed, dest);

      // проверяем HTTP-статус
      if (result.status !== 200) {
        // при 404/других ошибках удаляем пустой файл и показываем сообщение
        try {
          await FileSystem.deleteAsync(dest, { idempotent: true });
        } catch (e) {
          console.warn('CLEANUP AFTER BAD DOWNLOAD ERROR', e);
        }

        if (result.status === 404) {
          setError('File not found (HTTP 404).');
        } else {
          setError(`Download failed (status ${result.status}).`);
        }
        return;
      }

      // успех
      setUrl('');
      await loadFiles();
    } catch (e) {
      console.warn('DOWNLOAD ERROR', e);
      setError('Download error. Check URL and network connection.');
    } finally {
      setDownloading(false);
    }
  };

  const renderItem: ListRenderItem<FileItem> = ({ item }) => (
    <View style={styles.fileRow}>
      <View style={styles.fileLeft}>
        <View style={styles.fileIcon}>
          <Text style={styles.fileIconText}>{item.name[0]?.toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.fileName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.fileSize}>{item.size || '—'}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.uri)}>
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.title}>Media files</Text>
            <Text style={styles.subtitle}>
              Files are stored in the app media directory. You can delete existing files or download
              new ones by URL.
            </Text>

            {/* Форма URL + кнопка ВВЕРХУ, над списком */}
            <View style={styles.urlRow}>
              <TextInput
                style={styles.urlInput}
                placeholder="https://example.com/video.mp4"
                placeholderTextColor="#9CA3AF"
                value={url}
                onChangeText={setUrl}
              />
              <TouchableOpacity
                style={[styles.downloadButton, downloading && { opacity: 0.6 }]}
                onPress={handleDownload}
                disabled={downloading}>
                <Text style={styles.downloadText}>{downloading ? 'Downloading…' : 'Download'}</Text>
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.listWrapper}>
              {loading ? (
                <View style={styles.loader}>
                  <ActivityIndicator size="large" />
                </View>
              ) : (
                <FlatList
                  data={files}
                  keyExtractor={(item) => item.uri}
                  renderItem={renderItem}
                  contentContainerStyle={
                    files.length === 0 ? styles.emptyListContainer : styles.listContent
                  }
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>No files yet. Add one using URL above.</Text>
                  }
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default FilesScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#E5E7EB',
  },
  content: {
    flex: 1,
    paddingHorizontal: 48,
    paddingVertical: 32,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },

  // форма теперь над списком и ближе к верху
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  urlInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    color: '#111827',
    paddingHorizontal: 16,
    fontSize: 16,
    marginRight: 12,
  },
  downloadButton: {
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: '#22C55E',
  },
  downloadText: {
    color: '#052E16',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    marginTop: 4,
    marginBottom: 4,
    color: '#DC2626',
    fontSize: 14,
  },

  listWrapper: {
    flex: 1,
    marginTop: 8,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  listContent: {
    paddingBottom: 4,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 18,
    textAlign: 'center',
  },

  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  fileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fileIconText: {
    color: '#1D4ED8',
    fontSize: 20,
    fontWeight: '700',
  },
  fileName: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '500',
    maxWidth: 480,
  },
  fileSize: {
    color: '#6B7280',
    fontSize: 14,
  },
  deleteButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F97316',
    backgroundColor: '#FFF7ED',
  },
  deleteText: {
    color: '#C2410C',
    fontSize: 16,
    fontWeight: '600',
  },
});
