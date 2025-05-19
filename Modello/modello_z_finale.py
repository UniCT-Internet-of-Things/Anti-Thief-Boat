
!pip install tinymlgen
from IPython import get_ipython
from IPython.display import display
import pandas as pd
import random
import numpy as np
import scipy.stats as stats
import matplotlib.pyplot as plt
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
from tinymlgen import *
import tensorflow as tf
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
from tensorflow.keras.utils import to_categorical 

# dati giroscopio // sono i dati su cui si è allenato il modello dell'esame
#list_numb = [-1.88,0.23,5.02,1.63,1.21,3.21,-1.98,-10.69,-15.34,-11.56,-5.62,2.50,9.39,13.80,10.30,5.34,2.75,-2.26,-9.82,-13.39,-13.98,-12.11,-8.77,-0.40,8.99,14.56,16.80,14.04,8.45,-1.31,-10.92,-15.73,-14.32,-8.87,1.27,13.80,43.26,61.34,64.88,59.18,49.81,42.20,35.02,20.37,26.33,17.19,5.30,-15.03,-20.67,-12.56,0.35,6.29,6.03,10.60,10.17,8.10,-0.73,-12.07,-14.47,-10.42,-5.53,2.39,8.75,10.66,13.57,11.69,2.88,-5.76,-11.27,-13.44,-8.89,-2.81,4.98,7.90,7.63,2.30,-5.76,-25.58,-51.98,-69.43,-69.76,-57.80,-45.44,-35.79,-30.17,-24.92,-24.12,-6.50,14.52,27.80,24.34,7.02,-4.55,-12.10,-13.01,-10.95,-6.31,0.56,8.24,14.09,12.42,2.89,-0.95,-6.63,-7.25,-8.70,-5.42,3.63,6.05,12.41,9.73,-1.94,-12.27,-16.12,-18.58,-19.40,-32.93,-50.98,-50.05,-47.01,-47.39,-53.13,-48.44,-54.35,-48.31,-28.38,-4.77,19.20,23.48,14.40,4.04,-5.79,-10.32,-15.85,-14.71,-7.40,2.35,9.03,10.85,5.65,-0.60,-6.32,-12.04,-12.39,-8.08,-1.20,6.36,14.37,11.48,5.55,-1.23,-4.12,-7.73,-7.38,-3.69,1.82,9.67,14.44,9.76,-4.40,-18.95,-28.80,-42.44,-58.58,-72.16,-64.37,-54.82,-33.44,-15.74,-0.93,-3.47,-5.29,-8.16,-12.84,-11.66,-8.31,-3.76,3.40,10.58,13.51,8.09,2.53,-6.52,-13.87,-16.86,-10.95,-2.25,4.82,9.84,10.70,7.45,3.21,-5.50,-16.88,-16.54,-19.24,7.66,53.78,75.99,74.49,73.53,72.51,51.35,30.08,9.52,-3.53,-10.97,-6.05,7.73,17.36,16.34,9.57,-0.94,-12.83,-21.31,-14.52,-3.00,7.94,14.56,14.41,11.84,10.79,4.97,-13.44,-24.75,-10.14,31.69,77.18,91.55,91.61,67.70,42.66,28.06,6.69,-13.76,-13.34,-0.24,17.56,29.56,26.66,17.25,4.27,-11.03,-23.57,-29.44,-21.24,8.27,31.82,37.13,27.02,-1.09,-22.68,-36.24,-33.62,-14.17,9.24,26.42,32.30,23.19,5.22,-16.66,-32.59,-34.13,-22.65,-1.92,21.19,45.77,34.96,-14.33,-71.37,-100.41,-109.29,-98.53,-73.53,-43.35,-21.53,-32.02,-22.48,10.62,27.20,21.90,7.30,-11.53,-26.64,-23.82,-11.31,7.37,28.09,36.77,25.11,1.92,-17.85,-26.11,-21.62,-7.08,8.34,21.02,28.22,24.41,11.83,-9.56,-51.77,-68.78,-62.27,-69.85,-72.13,-64.66,-56.67,-41.31,-23.69,-11.25,0.22,11.92,18.48,22.78,17.89,1.02,-19.60,-25.71,-19.39,-9.50,8.27,22.02,22.88,16.01,2.16,-12.99,-21.47,-21.21,-11.06,2.58,21.13,27.84,17.47,3.53,-13.08,-21.56,-19.17,-8.87,5.51,22.52,27.25,10.91,-21.56,-60.44,-87.69,-90.25,-74.02,-62.03,-43.97,-30.76,-18.73,-5.11,10.39,15.52,2.25,-17.27,-26.18,-24.12,-16.08,-4.61,10.68,25.95,26.07,18.47,-0.05,-18.90,-27.37,-26.92,-14.92,7.50,18.66,20.61,15.34,5.40,-1.08,-6.98,-14.98,-16.13,-9.36,5.94,16.33,19.31,14.18,5.20,-4.79,-11.69,-14.15,-8.34,-3.54,5.35,15.89,24.76,19.29,-5.66,-46.22,-61.66,-65.42,-60.01,-56.63,-49.38,-37.58,-27.89,-21.06,-16.40,-10.05,1.87,13.89,16.59,7.39,-3.28,-20.02,-29.08,-27.93,-17.85,1.52,23.54,39.77,43.11,34.56,15.20,-7.40,-28.21,-38.94,-38.06,-31.18,6.15,26.90,37.43,29.18,12.03,-38.86,-81.03,-90.52,-94.44,-86.87,-74.38,-57.12,-35.37,-8.02,11.68,18.85,17.30,8.10,-4.92,-14.31,-14.27,-5.56,6.68,12.47,9.22,3.13,-1.61,-3.54,-1.76,-5.56,-5.98,-2.33,3.67,8.75,5.94,3.47,4.64,-1.05,-5.44,7.10,27.88,44.85,54.90,58.39,56.98,47.09,35.63,18.58,7.72,-0.32,-7.37,-7.80,-3.27,-5.64,-2.61,0.14,1.26,7.28,9.11,3.79,-0.37,-3.27,1.62,1.30,-3.06,-5.04,-8.60,-16.05,-11.48,-8.16,1.70,15.83,15.90,14.56,11.96,2.98,-4.00,-5.60,-4.92,-1.70,2.82,3.04,1.12,3.07,3.37,-0.27,1.12,1.63,2.46,-1.01,-9.78,-7.94,-3.65,-0.82,4.93,8.56,8.69,0.27,-3.18,-6.18,-4.61,-2.24,4.52,6.20,5.54,4.73,-1.28,-3.63,-5.21,-0.29,1.83,-4.10,-8.25,-12.53,-12.69,-9.90,-1.53,6.56,9.50,9.03,10.59,9.06,4.10,-2.24,-0.07,5.59,2.92,-6.19,-6.69,-7.76,-5.88,-0.55,1.18,2.57,4.34,4.24,6.77,8.35,7.60,-1.99,2.54,-3.19,-4.86,-5.65,-7.81,-4.37,-3.43,-2.72,-1.78,1.57,1.69,1.88,5.37,7.56,6.18,3.02,2.12,-3.76,-5.62,-5.72,-2.09,0.15,-1.51,-0.98,-2.43,-1.18,0.95,2.22,0.50,0.32,1.44,3.73,4.41,3.87,0.15,-3.56,-5.89,-8.62,-6.56,-4.03,-2.16,0.13,1.91,-1.50,-2.17,4.06,9.44,6.73,5.77,1.95,2.64,6.22,3.63,3.70,-3.92,-6.92,-11.09,-10.24,-9.84,-7.40,-2.95,2.69,2.08,4.33,7.93,6.16,3.87,5.66,3.69,1.64,-1.20,-4.25,-4.97,-5.63,-5.14,-3.24,0.31,-1.05,2.85,9.17,7.64,5.37,3.40,-0.01,-6.04,-7.76,-7.56,-7.97,-7.40,-5.40,1.47,6.18,2.76,8.89,7.53,12.17,4.05,-1.40,-3.61,-8.81,-10.82,-9.93,-6.59,0.87,10.49,14.44,12.67,9.71,8.76,5.07,-2.25,-7.87,-12.50,-13.63,-10.22,-10.31,-5.53]

list_numb = pd.read_csv('45k_alert.csv') # parametri ottenuti dalla simulazione Godot
data = np.array(list_numb).reshape(-1, 1)

scaler = StandardScaler()
scaled_data = scaler.fit_transform(data)


sequence_length = 5
sequences = []
for i in range(len(scaled_data) - sequence_length + 1):
    sequences.append(scaled_data[i : i + sequence_length].flatten())

sequences = np.array(sequences)

targets = scaled_data[sequence_length:]

noise_factor = 0.2
noisy_sequences = sequences + noise_factor * np.random.normal(loc=0.0, scale=1.0, size=sequences.shape)

input_layer =  tf.keras.layers.Input(shape=(sequence_length,))
encoded =  tf.keras.layers.Dense(8, activation='relu')(input_layer)
decoded =  tf.keras.layers.Dense(sequence_length, activation='linear')(encoded)
autoencoder = tf.keras.Model(input_layer, decoded)

autoencoder.compile(optimizer='adam', loss='mse')
# per evitare overfitting
early_stop = EarlyStopping(monitor='loss', patience=5, restore_best_weights=True)
# alleniamo
autoencoder.fit(noisy_sequences, sequences, epochs=20, batch_size=32, callbacks=[early_stop])

reconstructions = autoencoder.predict(sequences)

# Calculate MSE
mse = np.mean(np.square(sequences - reconstructions), axis=1)
padded_mse = np.pad(mse, (sequence_length - 1, 0), 'constant', constant_values=np.nan)


threshold = np.nanpercentile(padded_mse, 90) # Use nanpercentile to handle padding NaNs
anomalies = np.where(padded_mse > threshold)[0]

# Plot the results with anomalies highlighted
plt.figure(figsize=(12, 6))
plt.plot(list_numb.values, label='Original Data')
plt.scatter(anomalies, list_numb.iloc[anomalies].values, color='red', label='Anomalies (Autoencoder)')
plt.title('Anomaly Detection using Autoencoder')
plt.xlabel('Data Point Index')
plt.ylabel('Value')
plt.legend()
plt.grid(True)
plt.show()

print("Anomaly Indices (Autoencoder):", anomalies)
print("Reconstruction MSE:", padded_mse[anomalies])
 

list_numb_flat  = list_numb.values.flatten()
list_numb_flat

Y = []
for i in anomalies:
  X = []
  for j in range(i - 2, i + 3):
    if 0 <= j < len(list_numb_flat):
      X.append(float(list_numb_flat[j]))
  Y.append(X)

new_list = []
for i in range(len(list_numb_flat)):
  is_in_y = False
  for y_list in Y:
    if list_numb_flat[i] in y_list:
      is_in_y = True
      break
  if not is_in_y:
    new_list.append(float(list_numb_flat[i]))

K = []
for i in range(len(new_list)):  # Iterate using indices
  if (i + 5 > len(new_list)):
    break
  T = [new_list[j] for j in range(i, i+5) if j < len(new_list)]
  i += 5
  K.append(T)


# siccome il numero di casi 0 sono molto maggiori limitiamo ad un 110% dei casi 1
target_k_length = int(len(Y) * 1.1)
if len(K) > target_k_length:
  K = K[:target_k_length]

combined_array = np.concatenate((np.array(Y), np.array(K)))
label = []

for i in range(len(combined_array)):
  if i < len(Y):
    label.append(1)
  else:
    label.append(0)



X_train, X_test, y_train, y_test = train_test_split(combined_array, label, test_size=0.1, random_state=42)

# Ensure y_train and y_test are numpy arrays
y_train = np.array(y_train)
y_test = np.array(y_test)

# One-hot encode the target labels
y_train_encoded = to_categorical(y_train, num_classes=2)
y_test_encoded = to_categorical(y_test, num_classes=2)

# Modello
model = Sequential([
    Dense(5, activation='relu', input_dim=5),
    Dense(10, activation='relu'),
    Dense(2, activation='softmax')
])

model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

# Addestramento - Use the one-hot encoded labels
model.fit(X_train, y_train_encoded, epochs=30, batch_size=32, validation_data=(X_test, y_test_encoded))

# Valutazione
loss, accuracy = model.evaluate(X_test, y_test_encoded) # Use the one-hot encoded labels
print(f"Test Accuracy: {accuracy:.2f}")

# Dettagli classificazione
y_pred = model.predict(X_test)
y_pred_classes = np.argmax(y_pred, axis=1)
y_true_classes = np.argmax(y_test_encoded, axis=1)

print("\nClassification Report:\n")
print(classification_report(y_true_classes, y_pred_classes))
print("Confusion Matrix:\n")
print(confusion_matrix(y_true_classes, y_pred_classes))

# prompt: plotta stampa la matrice di confusione

# Plotting the confusion matrix
cm = confusion_matrix(y_true_classes, y_pred_classes)
plt.figure(figsize=(8, 6))
plt.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
plt.title('Confusion Matrix')
plt.colorbar()
tick_marks = np.arange(2)
plt.xticks(tick_marks, ['Class 0', 'Class 1'])
plt.yticks(tick_marks, ['Class 0', 'Class 1'])
plt.xlabel('Predicted Label')
plt.ylabel('True Label')
# Add labels to the cells
thresh = cm.max() / 2.
for i in range(cm.shape[0]):
    for j in range(cm.shape[1]):
        plt.text(j, i, format(cm[i, j], 'd'),
                 ha="center", va="center",
                 color="white" if cm[i, j] > thresh else "black")
plt.show()

# debug per vedere le dimensioni del dataset
print("Dimensioni di X_train:", X_train.shape)
print("Dimensioni di X_test:", X_test.shape)
print("Dimensioni di y_train (original):", y_train.shape)
print("Dimensioni di y_test (original):", y_test.shape)
print("Dimensioni di y_train_encoded:", y_train_encoded.shape)
print("Dimensioni di y_test_encoded:", y_test_encoded.shape)

y_train_1d = np.argmax(y_train_encoded, axis=1)
y_test_1d = np.argmax(y_test_encoded, axis=1)

print("\nNumero di casi 0 in y_train:", np.sum(y_train_1d == 0))
print("Numero di casi 1 in y_train:", np.sum(y_train_1d == 1))
print("Numero di casi 0 in y_test:", np.sum(y_test_1d == 0))
print("Numero di casi 1 in y_test:", np.sum(y_test_1d == 1))

#import in c
from tinymlgen import *
c_code = port(model, pretty_print=True, variable_name="anomaly_model", optimize = [tf.lite.Optimize.DEFAULT])
open("model_z.h", "w").write(c_code)
print(c_code)

#test veloce
prediction = model.predict(np.array([10,-10,20,1,-5]).reshape(1,-1)) # Reshape the input to a 2D array with 5 features
print(prediction)
