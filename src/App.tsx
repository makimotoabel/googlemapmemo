import React, { useState, useEffect, useMemo } from 'react';
import { Place, SortKey } from './types';
import { loadPlaces, savePlaces, parseGoogleTakeout, getAllCategories, getAllTags } from './storage';
import {
  MapPin, Search, Trash2, Edit3, Plus, Upload,
  ExternalLink, X, Check, Filter
} from 'lucide-react';
import './App.css';

const CATEGORY_EMOJIS: Record<string, string> = {
  '飲食店': '🍽️', 'カフェ': '☕', 'バー': '🍺', '観光': '🗼',
  'ショッピング': '🛍️', '宿泊': '🏨', 'スポーツ': '⚽', 'その他': '📍'
};

const PlaceCard: React.FC<{
  place: Place; categories: string[]; allTags: string[];
  onUpdate: (p: Place) => void; onDelete: (id: string) => void;
  selected: boolean; onSelect: (id: string) => void;
}> = ({ place, categories, onUpdate, onDelete, selected, onSelect }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(place);
  const [tagInput, setTagInput] = useState('');

  const save = () => { onUpdate({ ...draft, updatedAt: new Date().toISOString() }); setEditing(false); };
  const addTag = () => {
    const t = tagInput.trim();
    if (t && !draft.tags.includes(t)) setDraft(d => ({ ...d, tags: [...d.tags, t] }));
    setTagInput('');
  };
  const removeTag = (t: string) => setDraft(d => ({ ...d, tags: d.tags.filter(x => x !== t) }));
  const emoji = CATEGORY_EMOJIS[place.category] || '📍';

  return (
    <div
  className={`card ${selected ? 'card--selected' : ''}`}
  tabIndex={0}
  onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onSelect(place.id); } }}
>
      <div className="card__select" onClick={() => onSelect(place.id)}>
        <div className={`checkbox ${selected ? 'checkbox--checked' : ''}`}>
          {selected && <Check size={12} />}
        </div>
      </div>
      {editing ? (
        <div className="card__edit">
          <input className="input" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="場所の名前" />
          <select className="input" value={draft.category} onChange={e => setDraft(d => ({ ...d, category: e.target.value }))}>
            <option value="">カテゴリなし</option>
            {['飲食店','カフェ','バー','観光','ショッピング','宿泊','スポーツ','その他'].map(c => <option key={c} value={c}>{c}</option>)}
            {categories.filter(c => !['飲食店','カフェ','バー','観光','ショッピング','宿泊','スポーツ','その他'].includes(c)).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="tag-input-row">
            <input className="input" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag()} placeholder="タグを追加（Enterで確定）" />
            <button className="btn btn--sm" onClick={addTag}>追加</button>
          </div>
          <div className="tags">{draft.tags.map(t => <span key={t} className="tag tag--editable">{t}<button onClick={() => removeTag(t)}><X size={10} /></button></span>)}</div>
          <textarea className="input textarea" value={draft.memo} onChange={e => setDraft(d => ({ ...d, memo: e.target.value }))} placeholder="メモ・コメント" rows={3} />
          <input className="input" value={draft.address} onChange={e => setDraft(d => ({ ...d, address: e.target.value }))} placeholder="住所" />
          <div className="card__edit-actions">
            <button className="btn btn--ghost" onClick={() => { setDraft(place); setEditing(false); }}>キャンセル</button>
            <button className="btn btn--primary" onClick={save}><Check size={14} /> 保存</button>
          </div>
        </div>
      ) : (
        <div className="card__view">
          <div className="card__header">
            <span className="card__emoji">{emoji}</span>
            <div className="card__title-wrap">
              <h3 className="card__title">{place.name}</h3>
              {place.category && <span className="category-badge">{place.category}</span>}
            </div>
            <div className="card__actions">
              <button className="icon-btn" onClick={() => setEditing(true)}><Edit3 size={15} /></button>
             <a className="icon-btn icon-btn--map"
  href={place.url || `https://www.google.com/maps/search/${encodeURIComponent(place.name + ' ' + place.address)}`}
  target="_blank" rel="noopener noreferrer" title="Googleマップで開く">
  <ExternalLink size={15} />
</a>
              <button className="icon-btn icon-btn--danger" onClick={() => onDelete(place.id)}><Trash2 size={15} /></button>
            </div>
          </div>
          {place.address && <p className="card__address"><MapPin size={12} /> {place.address}</p>}
          {place.tags.length > 0 && <div className="tags">{place.tags.map(t => <span key={t} className="tag">#{t}</span>)}</div>}
          {place.memo && <p className="card__memo">{place.memo}</p>}
        </div>
      )}
    </div>
  );
};

const ImportModal: React.FC<{ onImport: (places: Place[]) => void; onClose: () => void }> = ({ onImport, onClose }) => {
  const [error, setError] = useState('');
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        const places = parseGoogleTakeout(json);
        if (places.length === 0) throw new Error('場所データが見つかりませんでした');
        onImport(places); onClose();
      } catch (err: any) { setError(err.message || 'ファイルの読み込みに失敗しました'); }
    };
    reader.readAsText(file);
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2>Googleテイクアウトからインポート</h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal__body">
          <div className="steps">
            <div className="step"><span className="step__num">1</span><div><strong>Googleテイクアウトにアクセス</strong><p><a href="https://takeout.google.com" target="_blank" rel="noopener noreferrer">takeout.google.com</a> を開く</p></div></div>
            <div className="step"><span className="step__num">2</span><div><strong>「マップ（マイプレイス）」を選択</strong><p>他のチェックを外してマップだけ選ぶ</p></div></div>
            <div className="step"><span className="step__num">3</span><div><strong>エクスポートしてダウンロード</strong><p>ZIPを解凍すると <code>Saved Places.json</code> が入っています</p></div></div>
            <div className="step"><span className="step__num">4</span><div><strong>そのJSONファイルをここに読み込む</strong></div></div>
          </div>
          {error && <p className="error-msg">⚠️ {error}</p>}
          <label className="file-upload"><Upload size={20} /><span>JSONファイルを選択</span><input type="file" accept=".json" onChange={handleFile} /></label>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showImport, setShowImport] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlace, setNewPlace] = useState({ name: '', address: '', url: '' });

  useEffect(() => { setPlaces(loadPlaces()); }, []);
  useEffect(() => { savePlaces(places); }, [places]);

  const categories = getAllCategories(places);
  const allTags = getAllTags(places);

  const filtered = useMemo(() => places.filter(p => {
    const q = search.toLowerCase();
    return (!q || p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q) || p.memo.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q)))
      && (!filterCategory || p.category === filterCategory)
      && (!filterTag || p.tags.includes(filterTag));
  }).sort((a, b) => {
    if (sortKey === 'name') return a.name.localeCompare(b.name, 'ja');
    if (sortKey === 'category') return a.category.localeCompare(b.category, 'ja');
    return b.createdAt.localeCompare(a.createdAt);
  }), [places, search, filterCategory, filterTag, sortKey]);
const isAllSelected = filtered.length > 0 && filtered.every(p => selected.has(p.id));
const toggleSelectAll = () => {
  if (isAllSelected) {
    setSelected(new Set());
  } else {
    setSelected(new Set(filtered.map(p => p.id)));
  }
};
  const updatePlace = (updated: Place) => setPlaces(ps => ps.map(p => p.id === updated.id ? updated : p));
  const deletePlace = (id: string) => { if (window.confirm('この場所を削除しますか？')) { setPlaces(ps => ps.filter(p => p.id !== id)); setSelected(s => { s.delete(id); return new Set(s); }); } };
  const deleteSelected = () => { if (window.confirm(`${selected.size}件を削除しますか？`)) { setPlaces(ps => ps.filter(p => !selected.has(p.id))); setSelected(new Set()); } };
  const toggleSelect = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const handleImport = (newPlaces: Place[]) => setPlaces(ps => { const existing = new Set(ps.map(p => p.name + p.address)); return [...ps, ...newPlaces.filter(p => !existing.has(p.name + p.address))]; });
  const addManual = () => {
    if (!newPlace.name.trim()) return;
    setPlaces(ps => [{ id: crypto.randomUUID(), name: newPlace.name.trim(), address: newPlace.address.trim(), url: newPlace.url.trim(), category: '', tags: [], memo: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...ps]);
    setNewPlace({ name: '', address: '', url: '' }); setShowAddForm(false);
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar__logo"><MapPin size={20} className="logo-icon" /><span>マップメモ</span></div>
        <div className="sidebar__stats">
          <div className="stat"><span className="stat__num">{places.length}</span><span className="stat__label">総件数</span></div>
          <div className="stat"><span className="stat__num">{categories.length}</span><span className="stat__label">カテゴリ</span></div>
        </div>
        <div className="sidebar__section">
          <p className="sidebar__label">カテゴリ</p>
          <button className={`sidebar__item ${!filterCategory ? 'active' : ''}`} onClick={() => setFilterCategory('')}>すべて <span>{places.length}</span></button>
          {categories.map(c => <button key={c} className={`sidebar__item ${filterCategory === c ? 'active' : ''}`} onClick={() => setFilterCategory(c)}>{c} <span>{places.filter(p => p.category === c).length}</span></button>)}
        </div>
        {allTags.length > 0 && (
          <div className="sidebar__section">
            <p className="sidebar__label">タグ</p>
            <div className="sidebar__tags">{allTags.map(t => <button key={t} className={`tag ${filterTag === t ? 'tag--active' : ''}`} onClick={() => setFilterTag(filterTag === t ? '' : t)}>#{t}</button>)}</div>
          </div>
        )}
        <div className="sidebar__actions">
          <button className="btn btn--primary btn--full" onClick={() => setShowImport(true)}><Upload size={15} /> インポート</button>
          <button className="btn btn--ghost btn--full" onClick={() => setShowAddForm(v => !v)}><Plus size={15} /> 手動で追加</button>
        </div>
      </aside>

      <main className="main">
        <div className="toolbar">
          <div className="search-wrap">
            <Search size={16} className="search-icon" />
            <input className="search-input" placeholder="名前・メモ・タグで検索..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button className="search-clear" onClick={() => setSearch('')}><X size={14} /></button>}
          </div>
          <div className="toolbar__right">
           {filtered.length > 0 && (
  <button className={`btn btn--sm ${isAllSelected ? 'btn--primary' : 'btn--ghost'}`} onClick={toggleSelectAll}>
    <Check size={14} /> {isAllSelected ? '全解除' : '全選択'}
  </button>
)} <select className="select-sm" value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}>
              <option value="createdAt">追加順</option>
              <option value="name">名前順</option>
              <option value="category">カテゴリ順</option>
            </select>
            {selected.size > 0 && <button className="btn btn--danger btn--sm" onClick={deleteSelected}><Trash2 size={14} /> {selected.size}件削除</button>}
          </div>
        </div>

        {showAddForm && (
          <div className="add-form">
            <h3>場所を追加</h3>
            <div className="add-form__row">
              <input className="input" placeholder="場所の名前 *" value={newPlace.name} onChange={e => setNewPlace(v => ({ ...v, name: e.target.value }))} />
              <input className="input" placeholder="住所（任意）" value={newPlace.address} onChange={e => setNewPlace(v => ({ ...v, address: e.target.value }))} />
              <input className="input" placeholder="GoogleマップのURL（任意）" value={newPlace.url} onChange={e => setNewPlace(v => ({ ...v, url: e.target.value }))} />
            </div>
            <div className="add-form__actions">
              <button className="btn btn--ghost" onClick={() => setShowAddForm(false)}>キャンセル</button>
              <button className="btn btn--primary" onClick={addManual}>追加</button>
            </div>
          </div>
        )}

        {(filterCategory || filterTag) && (
          <div className="active-filters">
            <Filter size={13} />
            {filterCategory && <span className="filter-chip">{filterCategory}<button onClick={() => setFilterCategory('')}><X size={10} /></button></span>}
            {filterTag && <span className="filter-chip">#{filterTag}<button onClick={() => setFilterTag('')}><X size={10} /></button></span>}
            <span className="filter-count">{filtered.length}件</span>
          </div>
        )}

        {places.length === 0 ? (
          <div className="empty">
            <MapPin size={48} className="empty__icon" />
            <h2>まだ場所が登録されていません</h2>
            <p>Googleテイクアウトからインポートするか、手動で追加してください</p>
            <button className="btn btn--primary" onClick={() => setShowImport(true)}><Upload size={15} /> インポートする</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty"><Search size={40} className="empty__icon" /><h2>該当する場所が見つかりません</h2><p>検索条件を変えてみてください</p></div>
        ) : (
          <div className="grid">{filtered.map(p => <PlaceCard key={p.id} place={p} categories={categories} allTags={allTags} onUpdate={updatePlace} onDelete={deletePlace} selected={selected.has(p.id)} onSelect={toggleSelect} />)}</div>
        )}
      </main>

      {showImport && <ImportModal onImport={handleImport} onClose={() => setShowImport(false)} />}
    </div>
  );
}
