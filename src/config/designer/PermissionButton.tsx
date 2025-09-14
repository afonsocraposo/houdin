import { useState, useEffect } from "react";
import { Button, Alert, Text, Group } from "@mantine/core";
import {
  UserScriptPermissionChecker,
  UserScriptPermissionStatus,
} from "../../services/userScriptPermissionChecker";

export default function PermissionButton() {
  const [permissionStatus, setPermissionStatus] =
    useState<UserScriptPermissionStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    setIsChecking(true);
    try {
      const checker = UserScriptPermissionChecker.getInstance();
      const status = await checker.checkPermissionStatus();
      setPermissionStatus(status);
    } catch (error) {
      console.error("Error checking permission:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const requestPermission = async () => {
    setIsRequesting(true);
    try {
      const checker = UserScriptPermissionChecker.getInstance();
      const granted = await checker.requestUserScriptsPermission();
      if (granted) {
        await checkPermission(); // Refresh status
      }
    } catch (error) {
      console.error("Error requesting permission:", error);
    } finally {
      setIsRequesting(false);
    }
  };

  if (isChecking) {
    return <Text size="sm">Checking permissions...</Text>;
  }

  if (!permissionStatus) {
    return (
      <Text size="sm" c="red">
        Unable to check permission status
      </Text>
    );
  }

  return (
    <div>
      {permissionStatus.enabled ? (
        <Alert color="green" variant="light">
          <Text size="sm">✅ UserScript permission is enabled</Text>
        </Alert>
      ) : (
        <div>
          <Alert color="orange" variant="light" mb="sm">
            <Text size="sm">⚠️ UserScript permission is not enabled</Text>
            {permissionStatus.toggleInstructions && (
              <Text size="xs" mt="xs" style={{ whiteSpace: "pre-line" }}>
                {permissionStatus.toggleInstructions}
              </Text>
            )}
          </Alert>
          <Group>
            {permissionStatus.browser !== "chrome" && (
              <Button
                size="sm"
                variant="outline"
                onClick={requestPermission}
                loading={isRequesting}
              >
                Request Permission
              </Button>
            )}
            <Button size="sm" variant="subtle" onClick={checkPermission}>
              Refresh Status
            </Button>
          </Group>
        </div>
      )}
    </div>
  );
}
