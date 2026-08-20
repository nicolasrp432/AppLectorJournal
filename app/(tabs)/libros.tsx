import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, ActivityIndicator, Image, Modal, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import { useDismissibleSheet } from '../../hooks/useDismissibleSheet';

import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { useLibraryStore } from '../../store/useLibraryStore';
import { useProfileStore } from '../../store/useProfileStore';
import { useQuizCacheStore } from '../../store/useQuizCacheStore';
import { useFlashcardStore } from '../../store/useFlashcardStore';
import { ensureQuizForText, quizSliceFromContent } from '../../lib/quiz';
import { searchCoverByTitle, uploadCover } from '../../lib/covers';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { PushButton } from '../../components/ui/PushButton';
import { CATALOG_CONTENT } from '../../constants/catalogContent';
import { countWords } from '../../lib/text';
import type { LibraryItem } from '../../types/db';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const COVER_COLORS = [COLORS.focus, COLORS.calm, COLORS.swift, COLORS.joy, COLORS.loci, COLORS.memo];

type Tab = 'mybooks' | 'catalog';

export default function LibrosScreen() {
  const [tab, setTab]           = useState<Tab>('mybooks');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<LibraryItem | null>(null);
  const [menuItem, setMenuItem] = useState<LibraryItem | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [toast, setToast]       = useState<string | null>(null);

  const { list, insert, update, remove } = useLibraryStore();
  const hasMore       = useLibraryStore(s => s.hasMore);
  const isLoadingMore = useLibraryStore(s => s.isLoadingMore);
  const fetchMore     = useLibraryStore(s => s.fetchMore);
  const userId        = useProfileStore(s => s.profile?.id);
  const books         = list();

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const handleCatalogPress = async (item: CatalogItem) => {
    const existing = books.find(b => b.source === 'catalog' && b.title === item.title);
    if (existing) {
      router.push({ pathname: '/reader/[id]' as any, params: { id: existing.id } });
      return;
    }
    setAddingId(item.id);
    try {
      const content = CATALOG_CONTENT[item.id] ?? '';
      const newBook = await insert({
        kind: 'book',
        title: item.title,
        author: item.author ?? null,
        content,
        words: countWords(content),
        progress: 0,
        last_read_at: null,
        cover_color: item.cover_color,
        cover_url: item.cover_url ?? null,
        source: 'catalog',
      });
      router.push({ pathname: '/reader/[id]' as any, params: { id: newBook.id } });
    } finally {
      setAddingId(null);
    }
  };

  // ── Acciones del menú por libro ───────────────────────────────────────────
  const ensureBookContent = async (item: LibraryItem) => {
    if (item.content != null) return item.content;
    return useLibraryStore.getState().ensureContent(item.id);
  };

  const handleAnalyze = async (item: LibraryItem, force = false) => {
    setMenuItem(null);
    flash('Analizando con IA…');
    try {
      const content = await ensureBookContent(item);
      const slice = quizSliceFromContent(content);
      const qs = await ensureQuizForText(item.id, slice, 3, force);
      flash(qs.length ? `✓ ${qs.length} preguntas listas` : 'Texto demasiado corto para preguntas');
    } catch {
      flash('No se pudo generar (revisa la IA / conexión)');
    }
  };

  const handleAddToFlashcards = async (item: LibraryItem) => {
    setMenuItem(null);
    flash('Preparando flashcards…');
    try {
      const content = await ensureBookContent(item);
      const slice = quizSliceFromContent(content);
      // Asegura que existan preguntas (reusa caché o genera una vez).
      let questions = await ensureQuizForText(item.id, slice, 5);
      if (!questions.length) {
        // Reúne cualquier quiz previo cacheado para este libro.
        const cached = useQuizCacheStore.getState().quizzes[item.id] || [];
        questions = cached.flatMap(c => c.questions);
      }
      if (!questions.length) { flash('Aún no hay preguntas para convertir'); return; }

      const fc = useFlashcardStore.getState();
      const deck = await fc.createDeck(item.title, `Comprensión · ${item.title}`, item.cover_color, true);
      if (!deck) { flash('No se pudo crear el mazo'); return; }
      for (const q of questions) {
        await fc.createFlashcard(deck.id, q.q, q.opts[q.correct] ?? '', 'Pregunta de comprensión generada con IA');
      }
      flash(`✓ ${questions.length} tarjetas añadidas a "${item.title}"`);
    } catch {
      flash('No se pudieron crear las flashcards');
    }
  };

  const handleDelete = async (item: LibraryItem) => {
    setMenuItem(null);
    await remove(item.id);
    flash(`"${item.title}" eliminado`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Biblioteca</Text>
        <Pressable onPress={() => { setEditItem(null); setShowForm(true); }} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Agregar</Text>
        </Pressable>
      </View>

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
                <Ionicons name="library-outline" size={48} color={COLORS.subtle} />
                <Text style={styles.emptyText}>Tu biblioteca está vacía</Text>
                <Text style={styles.emptyHint}>Explora el Catálogo o pulsa “+ Agregar”</Text>
              </View>
            )
            : books.map(b => (
              <BookCard
                key={b.id}
                book={b}
                onPress={() => router.push({ pathname: '/reader/[id]' as any, params: { id: b.id } })}
                onMenu={b.source !== 'catalog' ? () => setMenuItem(b) : undefined}
              />
            ))
        )}
        {tab === 'mybooks' && hasMore && userId && userId !== 'local' && books.length > 0 && (
          <Pressable style={styles.loadMore} onPress={() => fetchMore(userId)} disabled={isLoadingMore}>
            {isLoadingMore
              ? <ActivityIndicator size="small" color={COLORS.focus} />
              : <Text style={styles.loadMoreText}>Cargar más</Text>}
          </Pressable>
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

      {showForm && (
        <BookFormModal
          editItem={editItem}
          userId={userId}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          onAdd={insert}
          onUpdate={update}
        />
      )}

      {menuItem && (
        <BookActionSheet
          book={menuItem}
          onClose={() => setMenuItem(null)}
          onEdit={() => { const it = menuItem; setMenuItem(null); setEditItem(it); setShowForm(true); }}
          onAnalyze={() => handleAnalyze(menuItem, false)}
          onRegenerate={() => handleAnalyze(menuItem, true)}
          onFlashcards={() => handleAddToFlashcards(menuItem)}
          onQuiz={() => { const it = menuItem; setMenuItem(null); router.push({ pathname: '/reader/[id]' as any, params: { id: it.id, mode: 'quiz' } }); }}
          onDelete={() => handleDelete(menuItem)}
        />
      )}

      {toast && (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// ── Cover (image with graceful fallback to color block) ──────────────────────
function Cover({ book, loading }: { book: { title: string; cover_color: string; cover_url?: string | null }; loading?: boolean }) {
  const [failed, setFailed] = useState(false);
  const showImg = !!book.cover_url && !failed;
  return (
    <View style={[styles.cover, { backgroundColor: book.cover_color }]}>
      {loading
        ? <ActivityIndicator color="#fff" />
        : showImg
          ? <Image source={{ uri: book.cover_url! }} style={styles.coverImg} resizeMode="cover" onError={() => setFailed(true)} />
          : <Text style={styles.coverInitial}>{book.title[0]}</Text>}
    </View>
  );
}

function BookCard({
  book, onPress, loading = false, badge, onMenu,
}: {
  book: Partial<LibraryItem> & { title: string; cover_color: string };
  onPress?: () => void;
  loading?: boolean;
  badge?: string;
  onMenu?: () => void;
}) {
  return (
    <Pressable onPress={onPress} disabled={loading} style={[styles.bookCard, { borderColor: book.cover_color + '40' }]}>
      <Cover book={book} loading={loading} />
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
        {book.words ? <Text style={styles.bookMeta}>{(book.words / 1000).toFixed(0)}k palabras</Text> : null}
        {book.progress !== undefined && book.progress > 0 && (
          <View style={{ marginTop: 8 }}>
            <ProgressBar value={book.progress} color={book.cover_color} height={6} />
            <Text style={styles.bookProgress}>{Math.round(book.progress * 100)}% leído</Text>
          </View>
        )}
      </View>
      {onMenu && (
        <Pressable onPress={onMenu} hitSlop={10} style={styles.menuBtn}>
          <Ionicons name="ellipsis-vertical" size={18} color={COLORS.muted} />
        </Pressable>
      )}
    </Pressable>
  );
}

// ── Action sheet (cross-platform; reliable on web) ───────────────────────────
function BookActionSheet({
  book, onClose, onEdit, onAnalyze, onRegenerate, onFlashcards, onQuiz, onDelete,
}: {
  book: LibraryItem;
  onClose: () => void;
  onEdit: () => void;
  onAnalyze: () => void;
  onRegenerate: () => void;
  onFlashcards: () => void;
  onQuiz: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const Item = ({ icon, label, onPress, danger }: { icon: any; label: string; onPress: () => void; danger?: boolean }) => (
    <Pressable onPress={onPress} style={styles.sheetItem}>
      <Ionicons name={icon} size={20} color={danger ? '#EF4444' : COLORS.ink} />
      <Text style={[styles.sheetItemText, danger && { color: '#EF4444' }]}>{label}</Text>
    </Pressable>
  );
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.sheetTitle} numberOfLines={1}>{book.title}</Text>
          {confirmDelete ? (
            <>
              <Text style={styles.sheetConfirm}>¿Eliminar este texto y sus preguntas? No se puede deshacer.</Text>
              <Item icon="trash" label="Sí, eliminar" onPress={onDelete} danger />
              <Item icon="close" label="Cancelar" onPress={() => setConfirmDelete(false)} />
            </>
          ) : (
            <>
              <Item icon="create-outline" label="Editar" onPress={onEdit} />
              <Item icon="sparkles-outline" label="Analizar con IA (generar preguntas)" onPress={onAnalyze} />
              <Item icon="help-circle-outline" label="Quiz de comprensión" onPress={onQuiz} />
              <Item icon="refresh-outline" label="Regenerar preguntas" onPress={onRegenerate} />
              <Item icon="albums-outline" label="Añadir a flashcards" onPress={onFlashcards} />
              <Item icon="trash-outline" label="Eliminar" onPress={() => setConfirmDelete(true)} danger />
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type InsertItem = Omit<LibraryItem, 'id' | 'user_id' | 'created_at'>;
function BookFormModal({
  editItem, userId, onClose, onAdd, onUpdate,
}: {
  editItem: LibraryItem | null;
  userId?: string;
  onClose: () => void;
  onAdd: (item: InsertItem) => Promise<LibraryItem>;
  onUpdate: (id: string, patch: Partial<LibraryItem>) => Promise<void>;
}) {
  const isEdit = !!editItem;
  const [title,   setTitle]   = useState(editItem?.title ?? '');
  const [author,  setAuthor]  = useState(editItem?.author ?? '');
  const [content, setContent] = useState(editItem?.content ?? '');
  const [coverUrl, setCoverUrl] = useState<string | null>(editItem?.cover_url ?? null);
  const [coverColor] = useState(editItem?.cover_color ?? COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)]);
  const [isLoading, setIsLoading] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  // Secciones colapsadas por defecto para reducir la altura del sheet.
  const [coverOpen, setCoverOpen]   = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Bottom sheet arrastrable. Entra deslizando hacia arriba y se cierra
  // deslizando hacia abajo por el handle, por la X, por tap en el fondo o atrás.
  // La mecánica del gesto (histéresis, goma en el borde, proyección de inercia)
  // vive en useDismissibleSheet, compartida con los otros cinco sheets.
  const SHEET_MAX = Math.min(SCREEN_HEIGHT * 0.9, 760);
  const sheet = useDismissibleSheet({ onDismiss: onClose, height: SCREEN_HEIGHT });
  const handleClose = sheet.close;

  // Si editamos y aún no está el contenido en memoria, cárgalo.
  React.useEffect(() => {
    if (isEdit && editItem && editItem.content == null) {
      useLibraryStore.getState().ensureContent(editItem.id).then(c => { if (c != null) setContent(c); });
    }
  }, []);

  const handlePickFile = async () => {
    try {
      setIsLoading(true); setErrorMsg('');
      const pickerResult = await DocumentPicker.getDocumentAsync({ type: ['text/plain', 'application/pdf'], copyToCacheDirectory: true });
      if (pickerResult.canceled || !pickerResult.assets?.length) { setIsLoading(false); return; }
      const asset = pickerResult.assets[0];
      const fileName = asset.name || 'Documento';
      const isPdf = asset.mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
      if (!title) setTitle(fileName.replace(/\.[^/.]+$/, ''));
      if (isPdf) {
        const formData = new FormData();
        formData.append('file', { uri: asset.uri, name: fileName, type: 'application/pdf' } as any);
        const { data: sessionData } = await supabase.auth.getSession();
        const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/process-pdf`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionData?.session?.access_token || ''}`,
            'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
          },
          body: formData,
        });
        if (!response.ok) {
          const errorJson = await response.json().catch(() => ({ error: 'Error processing PDF server side.' }));
          throw new Error(errorJson.error || 'Error processing PDF');
        }
        const resData = await response.json();
        if (!resData.text) throw new Error('El PDF no contiene texto legible.');
        setContent(resData.text);
      } else {
        const text = await (await fetch(asset.uri)).text();
        setContent(text);
      }
    } catch (err: any) {
      console.warn(err);
      // "Failed to fetch" / errores de red al llamar a process-pdf suelen
      // significar que la función no está desplegada o falló CORS.
      const msg = String(err?.message || '');
      const isNetwork = /failed to fetch|networkerror|load failed/i.test(msg);
      setErrorMsg(
        isNetwork
          ? 'No se pudo procesar el PDF (el servicio no está disponible ahora mismo). Sube un .txt o pega el texto directamente.'
          : (msg || 'Error al procesar el archivo. Intenta de nuevo.'),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      setCoverBusy(true); setErrorMsg('');
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
      if (res.canceled || !res.assets?.length) { setCoverBusy(false); return; }
      const uri = res.assets[0].uri;
      // Sube a Storage si hay sesión; si no, usa la uri local (válida en sesión).
      const itemId = editItem?.id ?? `tmp_${Date.now()}`;
      const uploaded = userId && userId !== 'local' ? await uploadCover(userId, itemId, uri) : null;
      setCoverUrl(uploaded ?? uri);
    } catch (err: any) {
      setErrorMsg('No se pudo cargar la imagen.');
    } finally {
      setCoverBusy(false);
    }
  };

  const handleSearchCover = async () => {
    if (!title.trim()) { setErrorMsg('Escribe un título para buscar la portada.'); return; }
    setCoverBusy(true); setErrorMsg('');
    const url = await searchCoverByTitle(title);
    setCoverBusy(false);
    if (url) setCoverUrl(url);
    else setErrorMsg('No se encontró portada para ese título.');
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    if (isEdit && editItem) {
      await onUpdate(editItem.id, {
        title, author: author || null, content,
        words: countWords(content), cover_url: coverUrl,
      });
    } else {
      await onAdd({
        kind: 'text', title, author: author || null, content,
        words: countWords(content), progress: 0, last_read_at: null,
        cover_color: coverColor, cover_url: coverUrl, source: 'custom',
      });
    }
    onClose();
  };

  return (
    <Modal transparent visible animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        <Animated.View style={[styles.formSheet, { maxHeight: SHEET_MAX }, sheet.style]}>
          {/* Handle arrastrable (deslizar abajo para cerrar) */}
          <GestureDetector gesture={sheet.gesture}>
            <View style={styles.dragZone}>
              <View style={styles.dragHandle} />
            </View>
          </GestureDetector>

          {/* Cabecera con X */}
          <View style={styles.formHeader}>
            <Text style={styles.modalTitle}>{isEdit ? 'Editar texto' : 'Agregar libro o documento'}</Text>
            <Pressable onPress={handleClose} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.muted} />
            </Pressable>
          </View>

          <ScrollView
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Campos principales siempre visibles */}
            <Text style={styles.fieldLabel}>Título *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Nombre del libro o documento"
              placeholderTextColor={COLORS.subtle}
            />
            <View style={{ height: 12 }} />
            <Text style={styles.fieldLabel}>Autor / Origen</Text>
            <TextInput
              style={styles.input}
              value={author}
              onChangeText={setAuthor}
              placeholder="Opcional"
              placeholderTextColor={COLORS.subtle}
            />
            <View style={{ height: 12 }} />
            <Text style={styles.fieldLabel}>Texto o contenido</Text>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              value={content}
              onChangeText={setContent}
              placeholder="Pega aquí el contenido o súbelo en “Subir archivo”…"
              placeholderTextColor={COLORS.subtle}
              multiline
            />
            <View style={{ height: 14 }} />

            {/* Sección colapsable: Portada */}
            <Collapsible title="Portada" icon="image-outline" open={coverOpen} onToggle={() => setCoverOpen(o => !o)}>
              <View style={styles.coverRow}>
                <View style={[styles.coverPreview, { backgroundColor: coverColor }]}>
                  {coverBusy
                    ? <ActivityIndicator color="#fff" />
                    : coverUrl
                      ? <Image source={{ uri: coverUrl }} style={styles.coverImg} resizeMode="cover" />
                      : <Text style={styles.coverInitial}>{(title[0] || '?').toUpperCase()}</Text>}
                </View>
                <View style={{ flex: 1, gap: 8 }}>
                  <Pressable onPress={handlePickImage} style={styles.coverBtn}>
                    <Ionicons name="image-outline" size={16} color={COLORS.focus} />
                    <Text style={styles.coverBtnText}>Elegir imagen</Text>
                  </Pressable>
                  <Pressable onPress={handleSearchCover} style={styles.coverBtn}>
                    <Ionicons name="search-outline" size={16} color={COLORS.focus} />
                    <Text style={styles.coverBtnText}>Buscar por título</Text>
                  </Pressable>
                  {coverUrl && (
                    <Pressable onPress={() => setCoverUrl(null)} style={styles.coverBtn}>
                      <Ionicons name="close-circle-outline" size={16} color={COLORS.muted} />
                      <Text style={[styles.coverBtnText, { color: COLORS.muted }]}>Quitar portada</Text>
                    </Pressable>
                  )}
                </View>
              </View>
              <Text style={[styles.fieldLabel, { marginTop: 4 }]}>URL de portada</Text>
              <TextInput
                style={styles.input}
                value={coverUrl ?? ''}
                onChangeText={(v) => setCoverUrl(v || null)}
                placeholder="https://… (opcional)"
                placeholderTextColor={COLORS.subtle}
                autoCapitalize="none"
              />
            </Collapsible>

            {/* Sección colapsable: Subir archivo */}
            <Collapsible title="Subir archivo (PDF o TXT)" icon="document-attach-outline" open={uploadOpen} onToggle={() => setUploadOpen(o => !o)}>
              <Pressable onPress={handlePickFile} disabled={isLoading} style={[styles.uploadBtn, isLoading && { opacity: 0.7 }]}>
                <Ionicons name="document-attach-outline" size={20} color={COLORS.focus} />
                <Text style={styles.uploadBtnText}>Elegir archivo</Text>
              </Pressable>
              {isLoading && (
                <View style={styles.uploadingContainer}>
                  <ActivityIndicator color={COLORS.focus} size="small" />
                  <Text style={styles.uploadingText}>Procesando con Inteligencia Artificial...</Text>
                </View>
              )}
            </Collapsible>

            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

            <View style={{ height: 8 }} />
            <PushButton color={COLORS.focus} onPress={handleSubmit} disabled={isLoading || !title.trim()}>
              {isEdit ? 'Guardar cambios' : 'Agregar a biblioteca'}
            </PushButton>
            <View style={{ height: 8 }} />
            <Pressable onPress={handleClose} style={{ alignItems: 'center', paddingVertical: 8 }}>
              <Text style={{ fontFamily: FONTS.body, color: COLORS.muted }}>Cancelar</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Sección colapsable (toggle) para acortar el formulario.
function Collapsible({ title, icon, open, onToggle, children }: {
  title: string;
  icon: any;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.collapsible}>
      <Pressable onPress={onToggle} style={styles.collapsibleHeader}>
        <Ionicons name={icon} size={18} color={COLORS.focus} />
        <Text style={styles.collapsibleTitle}>{title}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.muted} style={{ marginLeft: 'auto' }} />
      </Pressable>
      {open && <View style={styles.collapsibleBody}>{children}</View>}
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
  { id: 'c9', title: 'La meta es el enfoque',     author: 'C. Newport',     words: 80000,  cover_color: COLORS.focus, progress: 0, source: 'catalog' },
  { id: 'c10', title: 'Aprender a aprender',      author: 'B. Oakley',      words: 45000,  cover_color: COLORS.loci,  progress: 0, source: 'catalog' },
  { id: 'c11', title: 'El arte del palacio mental',author: 'F. Yates',       words: 38000,  cover_color: COLORS.memo,  progress: 0, source: 'catalog' },
];

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: COLORS.canvas },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontFamily: FONTS.heading, fontSize: 26, lineHeight: 31, letterSpacing: -0.55, color: COLORS.ink },
  addBtn:     { backgroundColor: COLORS.focus, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { fontFamily: FONTS.heading, fontSize: 13, color: '#fff' },
  tabs:       { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 12, gap: 8 },
  tab:        { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: COLORS.surface },
  tabActive:  { backgroundColor: COLORS.ink },
  tabText:    { fontFamily: FONTS.headingSemi, fontSize: 13, color: COLORS.muted },
  tabTextActive: { color: '#fff' },
  scroll:     { paddingHorizontal: 20 },
  bookCard:   { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 18, borderWidth: 1.5, padding: 12, marginBottom: 12, gap: 12 },
  cover:      { width: 72, height: 96, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  coverImg:   { width: '100%', height: '100%' },
  coverInitial: { fontFamily: FONTS.heading, fontSize: 32, letterSpacing: -0.7, color: '#fff' },
  bookInfo:   { flex: 1, justifyContent: 'center' },
  bookTitle:  { fontFamily: FONTS.headingSemi, fontSize: 15, color: COLORS.ink, lineHeight: 20 },
  bookAuthor: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.muted, marginTop: 2 },
  bookMeta:   { fontFamily: FONTS.body, fontSize: 11, color: COLORS.subtle, marginTop: 4 },
  bookProgress: { fontFamily: FONTS.body, fontSize: 10, color: COLORS.muted, marginTop: 3 },
  menuBtn:    { padding: 4, alignSelf: 'flex-start' },
  badge:        { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  badgeText:    { fontFamily: FONTS.headingSemi, fontSize: 9 },
  emptyState:   { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontFamily: FONTS.heading, fontSize: 18, letterSpacing: -0.2, color: COLORS.ink },
  emptyHint:    { fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted },
  loadMore:     { marginTop: 8, paddingVertical: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: COLORS.border },
  loadMoreText: { fontFamily: FONTS.headingSemi, fontSize: 14, color: COLORS.focus },

  // Toast
  toast:      { position: 'absolute', bottom: 96, left: 24, right: 24, backgroundColor: COLORS.ink, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center' },
  toastText:  { fontFamily: FONTS.headingSemi, fontSize: 13, color: '#fff', textAlign: 'center' },

  // Action sheet
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, paddingBottom: 32, gap: 4 },
  sheetTitle: { fontFamily: FONTS.heading, fontSize: 16, color: COLORS.ink, paddingHorizontal: 8, paddingVertical: 8 },
  sheetConfirm: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted, paddingHorizontal: 8, paddingBottom: 8, lineHeight: 19 },
  sheetItem:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 8, borderRadius: 12 },
  sheetItemText: { fontFamily: FONTS.headingSemi, fontSize: 14, color: COLORS.ink },

  // Modal form
  modalTitle: { fontFamily: FONTS.heading, fontSize: 20, letterSpacing: -0.45, color: COLORS.ink },
  formSheet:  { backgroundColor: COLORS.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 6, paddingBottom: 28 },
  dragZone:   { height: 44, alignItems: 'center', justifyContent: 'center' },
  dragHandle: { width: 44, height: 5, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.15)' },
  formHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  closeBtn:   { padding: 4 },
  collapsible:       { borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, marginBottom: 12, overflow: 'hidden' },
  collapsibleHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 14 },
  collapsibleTitle:  { fontFamily: FONTS.headingSemi, fontSize: 13, color: COLORS.ink },
  collapsibleBody:   { paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
  coverRow:   { flexDirection: 'row', gap: 14, marginBottom: 16, alignItems: 'center' },
  coverPreview: { width: 72, height: 96, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  coverBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 },
  coverBtnText: { fontFamily: FONTS.headingSemi, fontSize: 12, color: COLORS.focus },
  fieldLabel: { fontFamily: FONTS.headingSemi, fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  input:      { fontFamily: FONTS.body, fontSize: 15, borderWidth: 2, borderColor: COLORS.border, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, color: COLORS.ink },
  uploadBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.focus + '80', borderRadius: 14, paddingVertical: 14, marginBottom: 16, backgroundColor: COLORS.focus + '05' },
  uploadBtnText: { fontFamily: FONTS.headingSemi, fontSize: 14, color: COLORS.focus },
  uploadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
  uploadingText: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted },
  errorText:  { fontFamily: FONTS.body, fontSize: 13, color: '#EF4444', textAlign: 'center', marginBottom: 16 },
});
