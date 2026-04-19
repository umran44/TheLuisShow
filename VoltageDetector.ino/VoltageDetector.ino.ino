const int analogPin = A0;  // choose your analog pin

void setup() {
  Serial.begin(9600);
}

void loop() {
  int rawValue = analogRead(analogPin);  // 0–1023

  // Convert to voltage (assuming 5V board like Arduino Mega)
  float voltage = rawValue * (5.0 / 1023.0);

  Serial.print("Raw: ");
  Serial.print(rawValue);
  Serial.print("  Voltage: ");
  Serial.println(voltage);

  delay(200);
}
