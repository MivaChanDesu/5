import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  Modal,
  Switch,
} from "react-native";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Buffer } from "buffer";
import * as Sharing from "expo-sharing";

const App = () => {
  const [journalId, setJournalId] = useState("");
  const [filePath, setFilePath] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const checkPopupPreference = async () => {
      try {
        const value = await AsyncStorage.getItem("dontShowPopup");
        if (value !== "true") {
          setShowPopup(true);
        }
      } catch (error) {
        console.error("Ошибка при получении предпочтений:", error);
      }
    };

    checkPopupPreference();
  }, []);

  const handlePopupClose = async () => {
    if (dontShowAgain) {
      try {
        await AsyncStorage.setItem("dontShowPopup", "true");
      } catch (error) {
        console.error("Ошибка при сохранении предпочтений:", error);
      }
    }
    setShowPopup(false);
  };

  const handleSwitchChange = async (newValue) => {
    setDontShowAgain(newValue);
    try {
      await AsyncStorage.mergeItem(
        "dontShowPopup",
        JSON.stringify({ dontShowAgain: newValue })
      );
    } catch (error) {
      console.error("Ошибка при обновлении предпочтений:", error);
    }
  };

  // Функция для открытия PDF-файла
  const openPdf = async (uri) => {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    } else {
      Alert.alert(
        "Ошибка",
        "Открытие PDF не поддерживается на этом устройстве."
      );
    }
  };

  const downloadJournal = async () => {
    const url = `http://ntv.ifmo.ru/file/journal/${journalId}.pdf`;
    const fileUri = `${FileSystem.documentDirectory}${journalId}.pdf`;
    try {
      const response = await axios.get(url, { responseType: "arraybuffer" });

      // Проверка content-type
      if (response.headers["content-type"] !== "application/pdf") {
        Alert.alert("Файл не найден", "Журнал с таким ID не существует.");
        return;
      }

      // Преобразование ArrayBuffer в строку Base64
      const base64Data = Buffer.from(response.data, "binary").toString(
        "base64"
      );

      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      setFilePath(fileUri);
      Alert.alert("Успех", `Файл загружен успешно.`);
      console.log(fileUri);
    } catch (error) {
      Alert.alert(
        "Ошибка",
        " файл не найден, возвращена главная страница сайта."
      );
      console.log("Ошибка при PDF:", error);
    }
  };

  const viewJournal = async () => {
    if (!filePath) {
      Alert.alert("Ошибка", "Файл не найден.");
      return;
    }
    console.log(filePath);
    try {
      await openPdf(filePath);
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось открыть файл.");
    }
  };

  const deleteJournal = async () => {
    if (!filePath) {
      Alert.alert("Ошибка", "Файл не найден.");
      return;
    }

    try {
      console.log(filePath);
      await FileSystem.deleteAsync(filePath);
      setFilePath(null);
      Alert.alert("Успех", "Файл удален.");
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось удалить файл.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Научно-технический вестник</Text>
      <TextInput
        style={styles.input}
        placeholder="Введите ID журнала"
        value={journalId}
        onChangeText={setJournalId}
        keyboardType="numeric"
      />
      <Button title="Скачать" onPress={downloadJournal} />
      {filePath && (
        <>
          <Button title="Смотреть" onPress={viewJournal} />
          <Button title="Удалить" onPress={deleteJournal} />
        </>
      )}

      <Modal
        transparent={true}
        visible={showPopup}
        animationType="slide"
        onRequestClose={() => setShowPopup(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              Добро пожаловать в приложение! Здесь вы можете скачать и
              просматривать журналы.
            </Text>
            <View style={styles.switchContainer}>
              <Switch
                value={dontShowAgain}
                onValueChange={handleSwitchChange}
              />
              <Text style={styles.switchLabel}>Больше не показывать</Text>
            </View>
            <Button title="ОК" onPress={handlePopupClose} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    width: "100%",
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
  },
  modalText: {
    marginBottom: 20,
    textAlign: "center",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  switchLabel: {
    marginLeft: 8,
  },
});

export default App;
