import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLibraryStore } from '../../store/useLibraryStore';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { PushButton } from '../../components/ui/PushButton';
import { CATALOG_CONTENT } from '../../constants/catalogContent';
import type { LibraryItem } from '../../types/db';

const COVER_COLORS = [COLORS.focus, COLORS.calm, COLORS.swift, COLORS.joy, COLORS.loci, COLORS.memo];

type Tab = 'mybooks' | 'catalog';

export default function LibrosScreen() {
  const [tab, setTab]         = useState<Tab>('mybooks');
  const [showAdd, setShowAdd] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const { list, insert }      = useLibraryStore();
  const books                 = list();

  const handleCatalogPress = async (item: CatalogItem) => {
    // If already in library (added from catalog before), navigate directly
    const existing = books.find(
      b => b.source === 'catalog' && b.title === item.title,
    );
    if (existing) {
      router.push({ pathname: '/reader/[id]' as any, params: { id: existing.id } });
      return;
    }

    // Add to library with content, then navigate
    setAddingId(item.id);
    try {
      const content = CATALOG_CONTENT[item.id] ?? '';
      const newBook = await insert({
        kind: 'book',
        title: item.title,
        author: item.author ?? null,
        content,
        words: content.split(/\s+/).filter(Boolean).length,
        progress: 0,
        last_read_at: null,
        cover_color: item.cover_color,
        source: 'catalog',
      });
      router.push({ pathname: '/reader/[id]' as any, params: { id: newBook.id } });
    } finally {
      setAddingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Biblioteca</Text>
        <Pressable onPress={() => setShowAdd(true)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Agregar</Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['mybooks', 'catalog'] as Tab[]).map(t => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'mybooks' ? 'Mis libros' : 'Catálogo'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {tab === 'mybooks' && (
          books.length === 0
            ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📚</Text>
                <Text style={styles.emptyText}>Tu biblioteca está vacía</Text>
                <Text style={styles.emptyHint}>Explora el Catálogo para empezar a leer</Text>
              </View>
            )
            : books.map(b => (
              <BookCard
                key={b.id}
                book={b}
                onPress={() => router.push({ pathname: '/reader/[id]' as any, params: { id: b.id } })}
              />
            ))
        )}
        {tab === 'catalog' && CATALOG.map(b => {
          const inLibrary = books.some(lb => lb.source === 'catalog' && lb.title === b.title);
          return (
            <BookCard
              key={b.id}
              book={b}
              loading={addingId === b.id}
              badge={inLibrary ? 'En tu biblioteca' : undefined}
              onPress={() => handleCatalogPress(b)}
            />
          );
        })}
        <View style={{ height: 110 }} />
      </ScrollView>

      {showAdd && <AddBookModal onClose={() => setShowAdd(false)} onAdd={insert} />}
    </SafeAreaView>
  );
}

function BookCard({
  book, onPress, loading = false, badge,
}: {
  book: Partial<LibraryItem> & { title: string; cover_color: string };
  onPress?: () => void;
  loading?: boolean;
  badge?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={[styles.bookCard, { borderColor: book.cover_color + '40' }]}
    >
      <View style={[styles.cover, { backgroundColor: book.cover_color }]}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.coverInitial}>{book.title[0]}</Text>
        }
      </View>
      <View style={styles.bookInfo}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
          {badge && (
            <View style={[styles.badge, { backgroundColor: book.cover_color + '20', borderColor: book.cover_color + '60' }]}>
              <Text style={[styles.badgeText, { color: book.cover_color }]}>{badge}</Text>
            </View>
          )}
        </View>
        {book.author && <Text style={styles.bookAuthor}>{book.author}</Text>}
        {book.words && <Text style={styles.bookMeta}>{(book.words / 1000).toFixed(0)}k palabras</Text>}
        {book.progress !== undefined && book.progress > 0 && (
          <View style={{ marginTop: 8 }}>
            <ProgressBar value={book.progress} color={book.cover_color} height={6} />
            <Text style={styles.bookProgress}>{Math.round(book.progress * 100)}% leído</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

type InsertItem = Omit<LibraryItem, 'id' | 'user_id' | 'created_at'>;
function AddBookModal({ onClose, onAdd }: { onClose: () => void; onAdd: (item: InsertItem) => void }) {
  const [title,   setTitle]   = useState('');
  const [author,  setAuthor]  = useState('');
  const [content, setContent] = useState('');

  const handleAdd = async () => {
    if (!title.trim()) return;
    await onAdd({
      kind: 'text', title, author: author || null, content,
      words: content.split(/\s+/).filter(Boolean).length,
      progress: 0, last_read_at: null,
      cover_color: COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)],
      source: 'custom',
    });
    onClose();
  };

  return (
    <View style={styles.modal}>
      <View style={styles.modalSheet}>
        <Text style={styles.modalTitle}>Agregar libro</Text>
        {[
          { label: 'Título *', value: title, setter: setTitle, placeholder: 'Nombre del libro' },
          { label: 'Autor', value: author, setter: setAuthor, placeholder: 'Opcional' },
        ].map(f => (
          <View key={f.label} style={{ marginBottom: 12 }}>
            <Text style={styles.fieldLabel}>{f.label}</Text>
            <TextInput
              style={styles.input}
              value={f.value}
              onChangeText={f.setter}
              placeholder={f.placeholder}
              placeholderTextColor={COLORS.subtle}
            />
          </View>
        ))}
        <Text style={styles.fieldLabel}>Texto</Text>
        <TextInput
          style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
          value={content}
          onChangeText={setContent}
          placeholder="Pega aquí el contenido…"
          placeholderTextColor={COLORS.subtle}
          multiline
        />
        <View style={{ height: 16 }} />
        <PushButton color={COLORS.focus} onPress={handleAdd}>Agregar</PushButton>
        <View style={{ height: 8 }} />
        <Pressable onPress={onClose} style={{ alignItems: 'center', paddingVertical: 8 }}>
          <Text style={{ fontFamily: FONTS.body, color: COLORS.muted }}>Cancelar</Text>
        </Pressable>
      </View>
    </View>
  );
}

type CatalogItem = { id: string; title: string; cover_color: string } & Partial<LibraryItem>;
const CATALOG: CatalogItem[] = [
  { id: 'c1', title: 'El cerebro lector',        author: 'S. Dehaene',     words: 95000,  cover_color: COLORS.calm,  progress: 0, source: 'catalog' },
  { id: 'c2', title: 'La atención como recurso',  author: 'D. Kahneman',   words: 55000,  cover_color: COLORS.joy,   progress: 0, source: 'catalog' },
  { id: 'c3', title: 'Memoria de trabajo',        author: 'A. Baddeley',    words: 40000,  cover_color: COLORS.loci,  progress: 0, source: 'catalog' },
  { id: 'c4', title: 'Hábitos pequeños',          author: 'J. Clear',       words: 70000,  cover_color: COLORS.focus, progress: 0, source: 'catalog' },
  { id: 'c5', title: 'Dormir para aprender',      author: 'M. Walker',      words: 48000,  cover_color: COLORS.calm,  progress: 0, source: 'catalog' },
  { id: 'c6', title: 'El método Pomodoro',        author: 'F. Cirillo',     words: 22000,  cover_color: COLORS.swift, progress: 0, source: 'catalog' },
  { id: 'c7', title: 'Lectura activa',            author: 'M. Adler',       words: 35000,  cover_color: COLORS.memo,  progress: 0, source: 'catalog' },
  { id: 'c8', title: 'Neuroplasticidad',          author: 'M. Doidge',      words: 65000,  cover_color: COLORS.joy,   progress: 0, source: 'catalog' },
];

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: COLORS.canvas },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title:      { fontFamily: FONTS.heading, fontSize: 26, color: COLORS.ink },
  addBtn:     { backgroundColor: COLORS.focus, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { fontFamily: FONTS.heading, fontSize: 13, color: '#fff' },
  tabs:       { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 12, gap: 8 },
  tab:        { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: COLORS.surface },
  tabActive:  { backgroundColor: COLORS.ink },
  tabText:    { fontFamily: FONTS.headingSemi, fontSize: 13, color: COLORS.muted },
  tabTextActive: { color: '#fff' },
  scroll:     { paddingHorizontal: 20 },
  bookCard:   { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 18, borderWidth: 1.5, padding: 12, marginBottom: 12, gap: 12 },
  cover:      { width: 72, height: 96, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  coverInitial: { fontFamily: FONTS.heading, fontSize: 32, color: '#fff' },
  bookInfo:   { flex: 1, justifyContent: 'center' },
  bookTitle:  { fontFamily: FONTS.headingSemi, fontSize: 15, color: COLORS.ink, lineHeight: 20 },
  bookAuthor: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.muted, marginTop: 2 },
  bookMeta:   { fontFamily: FONTS.body, fontSize: 11, color: COLORS.subtle, marginTop: 4 },
  bookProgress: { fontFamily: FONTS.body, fontSize: 10, color: COLORS.muted, marginTop: 3 },
  badge:        { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  badgeText:    { fontFamily: FONTS.headingSemi, fontSize: 9 },
  emptyState:   { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyEmoji:   { fontSize: 48 },
  emptyText:    { fontFamily: FONTS.heading, fontSize: 18, color: COLORS.ink },
  emptyHint:    { fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted },
  modal:      { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' } as any,
  modalSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalTitle: { fontFamily: FONTS.heading, fontSize: 20, color: COLORS.ink, marginBottom: 20 },
  fieldLabel: { fontFamily: FONTS.headingSemi, fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  input:      { fontFamily: FONTS.body, fontSize: 15, borderWidth: 2, borderColor: COLORS.border, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, color: COLORS.ink },
});
