import React, { useState, useEffect } from "react";
import { Select, Loader } from "@mantine/core";
import { ContentStorageClient } from "../services/storage";
import { Credential } from "../types/credentials";

interface CredentialsSelectProps {
  label: string;
  placeholder?: string;
  description?: string;
  value: string;
  onChange: (value: string | null) => void;
  required?: boolean;
  credentialType?: string; // Updated to use credentialType instead of service
}

export const CredentialsSelect: React.FC<CredentialsSelectProps> = ({
  label,
  placeholder,
  description,
  value,
  onChange,
  required,
  credentialType,
}) => {
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<{ value: string; label: string }[]>(
    [],
  );

  const storageClient = new ContentStorageClient();

  useEffect(() => {
    loadCredentials();
  }, [credentialType]);

  const loadCredentials = async () => {
    setLoading(true);
    try {
      let credentials: Credential[];

      if (credentialType) {
        credentials = await storageClient.getCredentialsByType(credentialType);
      } else {
        credentials = await storageClient.getCredentials();
      }

      const credentialOptions = credentials.map((cred) => ({
        value: cred.id,
        label: cred.name,
      }));

      setOptions(credentialOptions);
    } catch (error) {
      console.error("Failed to load credentials:", error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Select
        label={label}
        placeholder="Loading credentials..."
        description={description}
        disabled
        rightSection={<Loader size="xs" />}
        data={[]}
        value={value}
        required={required}
      />
    );
  }

  return (
    <Select
      label={label}
      placeholder={placeholder || "Select a credential"}
      description={description}
      data={options}
      value={value}
      onChange={onChange}
      required={required}
      searchable
    />
  );
};
