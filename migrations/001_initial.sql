-- Up
CREATE TABLE Translation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creation_timestamp INTEGER NOT NULL,
    lang VARCHAR(35) NOT NULL,
    native_text TEXT NOT NULL,
    translated_text TEXT NOT NULL
);

-- Down
DROP TABLE Translation;
