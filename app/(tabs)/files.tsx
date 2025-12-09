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
    }
  };

  const handleDelete = async (uri: string) => {
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
      await loadFiles();
    } catch (e) {
      console.warn('DELETE FILE ERROR', e);
    }
  };

  const handleDownload = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    // имя файла из URL
    let fileName = trimmed.split('/').pop() || `file_${Date.now()}`;
    // убираем query-параметры если есть
    fileName = fileName.split('?')[0];

    const dest = MEDIA_DIR + fileName;

    try {
      setDownloading(true);
      await FileSystem.downloadAsync(trimmed, dest);
      setUrl('');
      await loadFiles();
    } catch (e) {
      console.warn('DOWNLOAD ERROR', e);
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
    <View style={styles.root}>
      <View style={styles.card}>
        {/* заголовок + описание */}
        <Text style={styles.title}>Media files</Text>
        <Text style={styles.subtitle}>
          Files are stored in the app media directory. You can delete existing files or download new
          ones by URL.
        </Text>

        {/* список занимает всё оставшееся место карточки */}
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
                <Text style={styles.emptyText}>No files yet. Add one using URL below.</Text>
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* строка с URL внизу карточки */}
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
      </View>
    </View>
  );
};

export default FilesScreen;

const styles = StyleSheet.create({
  // фон как раньше — светло-серый, без скролла, экран полностью занят
  root: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 48,
    paddingVertical: 32,
  },
  // большая белая карточка во весь центр
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

  // обёртка списка, чтобы он занимал всё пространство между заголовком и инпутом
  listWrapper: {
    flex: 1,
    marginBottom: 16,
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

  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
});
