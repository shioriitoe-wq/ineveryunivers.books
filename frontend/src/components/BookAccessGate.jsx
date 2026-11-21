import { useEffect, useState } from "react";
import { getBook, getVolumes } from "../services/booksService";

/**
 * Client-side route gate for pages that contain static content and therefore
 * do not naturally request their protected resource before rendering.
 * The API remains the security boundary; this gate prevents a flash of content
 * and gives visitors a consistent lock message.
 */
export default function BookAccessGate({
  bookId,
  volumeId = null,
  children,
}) {
  const [state, setState] = useState({ loading: true, message: "" });

  useEffect(() => {
    let active = true;

    async function verify() {
      try {
        await getBook(bookId);

        if (volumeId !== null) {
          const volumes = await getVolumes(bookId);
          const allowed = Array.isArray(volumes) &&
            volumes.some((volume) => Number(volume.id) === Number(volumeId));

          if (!allowed) {
            throw new Error("Tento svazek není dostupný.");
          }
        }

        if (active) setState({ loading: false, message: "" });
      } catch (error) {
        if (active) {
          setState({
            loading: false,
            message: error?.message || "K tomuto obsahu nemáš přístup.",
          });
        }
      }
    }

    verify();
    return () => { active = false; };
  }, [bookId, volumeId]);

  if (state.loading) {
    return (
      <main style={{
        minHeight: "100vh", display: "grid", placeItems: "center",
        padding: "32px", background: "#071326", color: "#e8d8b6",
        textAlign: "center", fontFamily: "inherit"
      }}>
        Ověřuji přístup k obsahu…
      </main>
    );
  }

  if (state.message) {
    return (
      <main style={{
        minHeight: "100vh", display: "grid", placeItems: "center",
        padding: "32px", background: "#071326", color: "#e8d8b6",
        textAlign: "center", fontFamily: "inherit"
      }}>
        <section style={{
          maxWidth: "560px", padding: "36px", border: "1px solid #8e7447",
          borderRadius: "16px", background: "rgba(12, 29, 51, .94)"
        }}>
          <h1>Tento obsah není dostupný</h1>
          <p>{state.message}</p>
        </section>
      </main>
    );
  }

  return children;
}
