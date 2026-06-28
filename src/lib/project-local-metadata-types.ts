export type MandevProjectJson = {
  name?: string;
  slug?: string;
  description?: string;
  repositoryUrl?: string;
  notes?: string;
};

export type ProjectLocalMetadata = {
  name?: string;
  slug?: string;
  description?: string;
  repositoryUrl?: string;
  localPath: string;
  warnings: string[];
};

export type DetectProjectMetadataResult =
  | ({ ok: true } & ProjectLocalMetadata)
  | { ok: false; message: string };

export type DetectProjectMetadataActionResult =
  | { ok: true; metadata: ProjectLocalMetadata; message: string }
  | { ok: false; message: string };
