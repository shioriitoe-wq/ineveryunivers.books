import { useCallback, useEffect, useMemo, useState } from "react";
import "./CoversAdminPage.css";

const API_BASE =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://ineveryunivers-books-api.onrender.com/api";

const DEFAULT_CROP = { x: 0, y: 0, scale: 1 };

function cropFrom(item) {
  return {
    x: Number(item?.cover_position_x ?? 0),
    y: Number(item?.cover_position_y ?? 0),
    scale: Number(item?.cover_scale ?? 1),
  };
}

function CoversAdminPage() {
  const [books, setBooks] = useState([]);
  const [volumes, setVolumes] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState("");
  const [selectedVolumeId, setSelectedVolumeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingCrop, setSavingCrop] = useState(false);
  const [crop, setCrop] = useState(DEFAULT_CROP);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const request = useCallback(async (path, options = {}) => {
    const token = sessionStorage.getItem("adminToken");
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(options.body && !(options.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || `Požadavek selhal (${response.status}).`);
    }
    return data;
  }, []);

  const selectedBook = useMemo(
    () => books.find((book) => String(book.id) === String(selectedBookId)) || null,
    [books, selectedBookId]
  );

  const usesVolumes = Boolean(selectedBook?.uses_volumes);

  const selectedVolume = useMemo(
    () => volumes.find((volume) => String(volume.id) === String(selectedVolumeId)) || null,
    [volumes, selectedVolumeId]
  );

  const selectedItem = usesVolumes ? selectedVolume : selectedBook;
  const currentCover = selectedItem?.cover_url || "";

  const loadBooks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await request("/books");
      const list = Array.isArray(data) ? data : [];
      setBooks(list);
      setSelectedBookId((current) => {
        if (current && list.some((book) => String(book.id) === String(current))) {
          return current;
        }
        const defaultBook = list.find((book) => String(book.id) === "1") || list[0];
        return defaultBook ? String(defaultBook.id) : "";
      });
    } catch (err) {
      setError(err.message || "Knihy se nepodařilo načíst.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  const loadVolumes = useCallback(async (bookId) => {
    if (!bookId) {
      setVolumes([]);
      setSelectedVolumeId("");
      return;
    }

    try {
      const data = await request(`/books/${bookId}/volumes`);
      const list = Array.isArray(data) ? data : [];
      setVolumes(list);
      setSelectedVolumeId((current) => {
        if (current && list.some((volume) => String(volume.id) === String(current))) {
          return current;
        }
        return list[0] ? String(list[0].id) : "";
      });
    } catch (err) {
      setVolumes([]);
      setSelectedVolumeId("");
      setError(err.message || "Svazky se nepodařilo načíst.");
    }
  }, [request]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  useEffect(() => {
    if (selectedBook?.uses_volumes) {
      loadVolumes(selectedBook.id);
    } else {
      setVolumes([]);
      setSelectedVolumeId("");
    }
  }, [selectedBook?.id, selectedBook?.uses_volumes, loadVolumes]);

  useEffect(() => {
    setCrop(cropFrom(selectedItem));
  }, [
    selectedBookId,
    selectedVolumeId,
    usesVolumes,
    selectedItem?.cover_position_x,
    selectedItem?.cover_position_y,
    selectedItem?.cover_scale,
  ]);

  function updateCrop(key, value) {
    setCrop((current) => ({ ...current, [key]: Number(value) }));
    setError("");
    setNotice("");
  }

  async function saveCrop(nextCrop = crop) {
    if (!selectedBook || !currentCover || (usesVolumes && !selectedVolume)) return;

    setSavingCrop(true);
    setError("");
    setNotice("");
    const payload = {
      ...(usesVolumes ? selectedVolume : selectedBook),
      cover_position_x: nextCrop.x,
      cover_position_y: nextCrop.y,
      cover_scale: nextCrop.scale,
    };

    try {
      if (usesVolumes) {
        await request(`/books/${selectedBook.id}/volumes/${selectedVolume.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        await loadVolumes(selectedBook.id);
      } else {
        await request(`/books/${selectedBook.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        await loadBooks();
      }
      setNotice("Ořez obálky byl uložen.");
    } catch (err) {
      setError(err.message || "Nastavení ořezu se nepodařilo uložit.");
    } finally {
      setSavingCrop(false);
    }
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !selectedBook) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Vyber obrázek JPG, PNG nebo WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Obálka může mít maximálně 5 MB.");
      return;
    }
    if (usesVolumes && !selectedVolume) {
      setError("Nejdříve vyber svazek.");
      return;
    }

    setUploading(true);
    setError("");
    setNotice("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", usesVolumes ? "volume_cover" : "book_cover");

      const uploaded = await request("/admin/media/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploaded?.url) {
        throw new Error("Server nenavrátil adresu nahrané obálky.");
      }

      const resetCrop = { ...DEFAULT_CROP };
      const payload = {
        ...(usesVolumes ? selectedVolume : selectedBook),
        cover_url: uploaded.url,
        cover_position_x: resetCrop.x,
        cover_position_y: resetCrop.y,
        cover_scale: resetCrop.scale,
      };

      if (usesVolumes) {
        await request(`/books/${selectedBook.id}/volumes/${selectedVolume.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        await loadVolumes(selectedBook.id);
      } else {
        await request(`/books/${selectedBook.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        await loadBooks();
      }

      setCrop(resetCrop);
      setNotice("Obálka byla nahrána a uložena. Nyní můžeš upravit její ořez.");
    } catch (err) {
      setError(err.message || "Obálku se nepodařilo uložit.");
    } finally {
      setUploading(false);
    }
  }

  async function removeCover() {
    if (!selectedBook || !currentCover) return;
    if (!window.confirm("Opravdu chceš odebrat tuto obálku?")) return;

    setUploading(true);
    setError("");
    setNotice("");
    try {
      const payload = {
        ...(usesVolumes ? selectedVolume : selectedBook),
        cover_url: "",
        cover_position_x: 0,
        cover_position_y: 0,
        cover_scale: 1,
      };
      if (usesVolumes) {
        await request(`/books/${selectedBook.id}/volumes/${selectedVolume.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        await loadVolumes(selectedBook.id);
      } else {
        await request(`/books/${selectedBook.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        await loadBooks();
      }
      setCrop(DEFAULT_CROP);
      setNotice("Obálka byla odebrána.");
    } catch (err) {
      setError(err.message || "Obálku se nepodařilo odebrat.");
    } finally {
      setUploading(false);
    }
  }

  function resetCrop() {
    const reset = { ...DEFAULT_CROP };
    setCrop(reset);
    setNotice("");
    setError("");
  }

  function volumeLabel(volume) {
    return volume.number
      ? `Svazek ${volume.number}${volume.title ? ` – ${volume.title}` : ""}`
      : volume.title;
  }

  if (loading) {
    return <section className="covers-admin"><p className="covers-admin-muted">Načítám knihy…</p></section>;
  }

  return (
    <section className="covers-admin">
      <header className="covers-admin-heading">
        <div>
          <p className="covers-admin-eyebrow">ADMINISTRACE / VZHLED</p>
          <h1>Správa obálek</h1>
          <p>Jedno místo pro obálky knih a jednotlivých svazků.</p>
        </div>
      </header>

      {error && <div className="covers-admin-message is-error" role="alert">{error}</div>}
      {notice && <div className="covers-admin-message is-success" role="status">{notice}</div>}

      <div className="covers-admin-layout">
        <div className="covers-admin-controls">
          <label>
            Kniha
            <select
              value={selectedBookId}
              onChange={(event) => {
                setSelectedBookId(event.target.value);
                setError("");
                setNotice("");
              }}
            >
              {books.map((book) => (
                <option key={book.id} value={book.id}>{book.title}</option>
              ))}
            </select>
          </label>

          {usesVolumes && (
            <label>
              Svazek
              <select
                value={selectedVolumeId}
                onChange={(event) => {
                  setSelectedVolumeId(event.target.value);
                  setError("");
                  setNotice("");
                }}
                disabled={volumes.length === 0}
              >
                {volumes.length === 0 && <option value="">Kniha zatím nemá svazky</option>}
                {volumes.map((volume) => (
                  <option key={volume.id} value={volume.id}>{volumeLabel(volume)}</option>
                ))}
              </select>
            </label>
          )}

          <div className="covers-admin-upload">
            <label htmlFor="book-cover-upload">
              {usesVolumes ? "Nahrát obálku svazku" : "Nahrát obálku knihy"}
            </label>
            <input
              id="book-cover-upload"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={handleUpload}
              disabled={uploading || (usesVolumes && !selectedVolume)}
            />
            <small>JPG, PNG nebo WebP · maximálně 5 MB</small>
          </div>

          {currentCover && (
            <div className="covers-admin-crop-controls">
              <div className="covers-admin-section-title">Upravit ořez</div>
              <label className="covers-admin-range">
                <span><span>Přiblížení</span><strong>{crop.scale.toFixed(1)}×</strong></span>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={crop.scale}
                  onChange={(event) => updateCrop("scale", event.target.value)}
                  disabled={uploading || savingCrop}
                />
              </label>
              <label className="covers-admin-range">
                <span><span>Vodorovná poloha</span><strong>{Math.round(crop.x)}</strong></span>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="1"
                  value={crop.x}
                  onChange={(event) => updateCrop("x", event.target.value)}
                  disabled={uploading || savingCrop}
                />
              </label>
              <label className="covers-admin-range">
                <span><span>Svislá poloha</span><strong>{Math.round(crop.y)}</strong></span>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="1"
                  value={crop.y}
                  onChange={(event) => updateCrop("y", event.target.value)}
                  disabled={uploading || savingCrop}
                />
              </label>
              <div className="covers-admin-crop-actions">
                <button type="button" className="covers-admin-reset" onClick={resetCrop} disabled={uploading || savingCrop}>
                  Obnovit původní ořez
                </button>
                <button type="button" className="covers-admin-save" onClick={() => saveCrop()} disabled={uploading || savingCrop}>
                  {savingCrop ? "Ukládám…" : "Uložit ořez"}
                </button>
              </div>
              <small className="covers-admin-help">Změny vidíš ihned v náhledu. Do databáze se uloží až po stisknutí tlačítka.</small>
            </div>
          )}

          {currentCover && (
            <button
              type="button"
              className="covers-admin-remove"
              onClick={removeCover}
              disabled={uploading || savingCrop}
            >
              Odebrat obálku
            </button>
          )}
          {(uploading || savingCrop) && <p className="covers-admin-muted">{uploading ? "Nahrávám obálku…" : "Ukládám ořez…"}</p>}
        </div>

        <div className="covers-admin-preview">
          <div className="covers-admin-preview-frame">
            {currentCover ? (
              <img
                src={currentCover}
                alt={`Obálka – ${usesVolumes ? selectedVolume?.title : selectedBook?.title}`}
                style={{
  objectPosition: `${50 + crop.x}% 50%`,
  transform: `translateY(${crop.y}%) scale(${crop.scale})`,
}}
              />
            ) : (
              <div className="covers-admin-empty">
                <span aria-hidden="true">▧</span>
                <strong>Bez obálky</strong>
                <small>Vyber obrázek, který chceš přiřadit.</small>
              </div>
            )}
          </div>
          <div className="covers-admin-preview-caption">
            <strong>{usesVolumes ? selectedVolume?.title || "Vyber svazek" : selectedBook?.title}</strong>
            <span>{usesVolumes ? "Obálka konkrétního svazku" : "Obálka celé knihy"}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CoversAdminPage;
