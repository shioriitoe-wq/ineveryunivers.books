import { useEffect, useState } from "react";

import {

  getVesperaCharacters,

  addVesperaCharacter,

  updateVesperaCharacter,

} from "../services/vesperaCharactersService";



import "./VesperaCharacterForm.css";



const LOCATIONS = [

  "ENG",

  "ESP",

  "FRA",

  "RUS",

  "SWE",

  "Unknown",

];



const CLASSIFICATIONS = [

  "Extremely dangerous",

  "Dangerous",

  "Civilian",

  "Unknown",

];



const ASSIGNMENTS = [

  "Redford",

  "Palencia",

  "Björna",

  "Morlaix",

  "R.U.N.A",

  "URF",

  "Neznámé",

];



const emptyCharacter = {

  case_number: "",

  name: "",

  age: "",

  location: "Unknown",

  nexis_level: "",

  classification: "Unknown",

  operational_assignment: "Neznámé",

  available_information: "",

  status: "",

  last_record: "",

  case_manager: "",

  image_1: "",

  image_2: "",

  image_3: "",

  media: "",

  media_type: "",

  published: false,

};



function getFileName(path) {

  return String(path || "").split("/").pop() || "";

}



function isVideo(path) {

  return /\.(mp4|webm|mov|m4v)$/i.test(path || "");

}



function isAudio(path) {

  return /\.(mp3|wav|ogg|m4a)$/i.test(path || "");

}



export default function VesperaCharacterForm({

  bookId = 3,

  character = null,

  onSaved,

  onCancel,

}) {

  const [form, setForm] = useState(

    character

      ? { ...emptyCharacter, ...character }

      : { ...emptyCharacter }

  );



  const [manifest, setManifest] = useState([]);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");



  useEffect(() => {

    setForm(

      character

        ? { ...emptyCharacter, ...character }

        : { ...emptyCharacter }

    );

  }, [character]);



  useEffect(() => {

    fetch("/characters/manifest.json", {

      cache: "no-cache",

    })

      .then((response) => {

        if (!response.ok) {

          throw new Error("Manifest se nepodařilo načíst.");

        }



        return response.json();

      })

      .then((data) => {

        const files = Array.isArray(data) ? data : [];



        const vesperaFiles = files.filter((file) =>

          String(file || "")

            .replace(/\\/g, "/")

            .toLowerCase()

            .startsWith("vespera/")

        );



        setManifest(vesperaFiles);

      })

      .catch((err) => {

        console.error(err);

        setManifest([]);

      });

  }, []);



  function updateField(field, value) {

    setForm((previous) => ({

      ...previous,

      [field]: value,

    }));

  }



  async function handleSubmit(event) {

    event.preventDefault();



    setSaving(true);

    setError("");



    try {

      const payload = {

        ...form,

        book_id: Number(bookId),

        age:

          form.age === ""

            ? null

            : Number(form.age),

        nexis_level:

          form.nexis_level === ""

            ? null

            : Number(form.nexis_level),

      };



      let saved;



      if (character?.id) {

        saved = await updateVesperaCharacter(

          character.id,

          payload

        );

      } else {

        saved = await addVesperaCharacter(payload);

      }



      if (onSaved) {

        onSaved(saved);

      }

    } catch (err) {

      console.error(err);

      setError(

        err.message ||

          "Postavu se nepodařilo uložit."

      );

    } finally {

      setSaving(false);

    }

  }



  return (

    <form

      className="vespera-character-form"

      onSubmit={handleSubmit}

    >

      <h2>

        {character

          ? "Upravit postavu Vespery"

          : "Nová postava Vespery"}

      </h2>



      {error && (

        <div className="vespera-form-error">

          {error}

        </div>

      )}



      <div className="vespera-form-grid">



        <label>

          Číslo spisu

          <input

            value={form.case_number}

            onChange={(e) =>

              updateField(

                "case_number",

                e.target.value

              )

            }

          />

        </label>



        <label>

          Jméno

          <input

            value={form.name}

            onChange={(e) =>

              updateField(

                "name",

                e.target.value

              )

            }

            required

          />

        </label>



        <label>

          Věk

          <input

            type="number"

            min="0"

            value={form.age}

            onChange={(e) =>

              updateField(

                "age",

                e.target.value

              )

            }

          />

        </label>



        <label>

          Lokace

          <select

            value={form.location}

            onChange={(e) =>

              updateField(

                "location",

                e.target.value

              )

            }

          >

            {LOCATIONS.map((option) => (

              <option

                key={option}

                value={option}

              >

                {option}

              </option>

            ))}

          </select>

        </label>



        <label>

          Úroveň NEXIS

          <div className="vespera-percent-input">

            <input

              type="number"

              min="0"

              max="100"

              step="0.01"

              value={form.nexis_level}

              onChange={(e) =>

                updateField(

                  "nexis_level",

                  e.target.value

                )

              }

            />

            <span>%</span>

          </div>

        </label>



        <label>

          Klasifikace

          <select

            value={form.classification}

            onChange={(e) =>

              updateField(

                "classification",

                e.target.value

              )

            }

          >

            {CLASSIFICATIONS.map(

              (option) => (

                <option

                  key={option}

                  value={option}

                >

                  {option}

                </option>

              )

            )}

          </select>

        </label>



        <label>

          Operativní zařazení

          <select

            value={

              form.operational_assignment

            }

            onChange={(e) =>

              updateField(

                "operational_assignment",

                e.target.value

              )

            }

          >

            {ASSIGNMENTS.map((option) => (

              <option

                key={option}

                value={option}

              >

                {option}

              </option>

            ))}

          </select>

        </label>



        <label>

          Status

          <input

            value={form.status}

            onChange={(e) =>

              updateField(

                "status",

                e.target.value

              )

            }

          />

        </label>



        <label>

          Manifestace

          <input

            value={form.last_record}

            onChange={(e) =>

              updateField(

                "last_record",

                e.target.value

              )

            }

          />

        </label>



        <label>

          Hodnost

          <input

            value={form.case_manager}

            onChange={(e) =>

              updateField(

                "case_manager",

                e.target.value

              )

            }

          />

        </label>



      </div>



      <label className="vespera-full-field">

        Dostupné informace

        <textarea

          rows="10"

          value={

            form.available_information

          }

          onChange={(e) =>

            updateField(

              "available_information",

              e.target.value

            )

          }

        />

      </label>



      <div className="vespera-media-section">

        <h3>Obrázky</h3>



        <p className="vespera-media-hint">

          Vyber obrázek kliknutím na jeho náhled.

        </p>



        {[1, 2, 3].map((number) => {

          const field = `image_${number}`;

          const imageFiles = manifest.filter((file) =>

            /\.(png|jpg|jpeg|webp|gif|avif)$/i.test(file)

          );



          return (

            <div className="vespera-image-picker" key={field}>

              <div className="vespera-picker-title">

                Obrázek {number}

              </div>



              <div className="vespera-image-grid">

                {imageFiles.length === 0 ? (

                  <div className="vespera-no-media">

                    Ve složce Vespera zatím nejsou žádné obrázky.

                  </div>

                ) : (

                  imageFiles.map((file) => {

                    const selected = form[field] === file;



                    return (

                      <button

                        type="button"

                        key={file}

                        className={`vespera-image-option${

                          selected ? " selected" : ""

                        }`}

                        onClick={() => updateField(field, file)}

                        title={getFileName(file)}

                      >

                        <img

                          src={`/characters/${file}`}

                          alt={getFileName(file)}

                          loading="lazy"

                        />

                        <span>{getFileName(file)}</span>

                      </button>

                    );

                  })

                )}

              </div>



              {form[field] && (

                <div className="vespera-selected-file">

                  Vybráno: <strong>{getFileName(form[field])}</strong>

                  <button

                    type="button"

                    onClick={() => updateField(field, "")}

                  >

                    Zrušit výběr

                  </button>

                </div>

              )}

            </div>

          );

        })}

      </div>



      <div className="vespera-media-section">

        <h3>Nahrávka</h3>



        <p className="vespera-media-hint">

          Vyber video nebo zvukový soubor kliknutím na jeho náhled.

        </p>



        <div className="vespera-recording-grid">

          {manifest.filter((file) => isVideo(file) || isAudio(file)).length === 0 ? (

            <div className="vespera-no-media">

              Ve složce Vespera zatím nejsou žádná videa ani MP3.

            </div>

          ) : (

            manifest

              .filter((file) => isVideo(file) || isAudio(file))

              .map((file) => {

                const selected = form.media === file;



                return (

                  <button

                    type="button"

                    key={file}

                    className={`vespera-recording-option${

                      selected ? " selected" : ""

                    }`}

                    onClick={() => {

                      updateField("media", file);

                      updateField(

                        "media_type",

                        isAudio(file)

                          ? "audio"

                          : isVideo(file)

                          ? "video"

                          : ""

                      );

                    }}

                    title={getFileName(file)}

                  >

                    <div className="vespera-recording-preview">

                      {isVideo(file) ? (

                        <video

                          src={`/characters/${file}`}

                          muted

                          playsInline

                          preload="metadata"

                        />

                      ) : (

                        <div className="vespera-audio-preview">

                          <span>♫</span>

                          <small>MP3 / AUDIO</small>

                        </div>

                      )}

                    </div>

                    <span>{getFileName(file)}</span>

                  </button>

                );

              })

          )}

        </div>



        {form.media && (

          <div className="vespera-selected-file">

            Vybráno: <strong>{getFileName(form.media)}</strong>

            <button

              type="button"

              onClick={() => {

                updateField("media", "");

                updateField("media_type", "");

              }}

            >

              Zrušit výběr

            </button>

          </div>

        )}

      </div>



      <label className="vespera-published">

        <input

          type="checkbox"

          checked={Boolean(form.published)}

          onChange={(e) =>

            updateField(

              "published",

              e.target.checked

            )

          }

        />

        Publikováno

      </label>



      <div className="vespera-form-actions">

        <button

          type="submit"

          disabled={saving}

        >

          {saving

            ? "Ukládám..."

            : "Uložit postavu"}

        </button>



        {onCancel && (

          <button

            type="button"

            onClick={onCancel}

          >

            Zrušit

          </button>

        )}

      </div>

    </form>

  );

}