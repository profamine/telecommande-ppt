package com.amineamahan.pptbluetooth;

import android.Manifest;
import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothClass;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothHidDevice;
import android.bluetooth.BluetoothHidDeviceAppSdpSettings;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothProfile;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.view.Gravity;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Télécommande PPT Bluetooth : télécommande PowerPoint sans Wi-Fi ni logiciel sur le PC.
 * Le téléphone se présente au PC comme un clavier et une souris Bluetooth (profil HID) :
 * flèches, F5, B, W, Échap pour PowerPoint, et souris + Ctrl+L pour le pointeur laser.
 * Les touches de volume servent aussi à changer de diapositive.
 */
public class MainActivity extends Activity {

    // Couleurs (identiques à l'interface web)
    private static final int BG = 0xFF111318, PANEL = 0xFF1B1E26, PANEL2 = 0xFF252A35;
    private static final int TEXT = 0xFFEEF0F5, MUTED = 0xFF8B93A7, ACCENT = 0xFFE8643C;
    private static final int OK = 0xFF3CCF7A, ERR = 0xFFEF5350, WARN = 0xFFF2B84B, BLUE = 0xFF2F6BFF;

    // Codes de touches HID (page « Keyboard/Keypad »)
    private static final int KEY_RIGHT = 0x4F, KEY_LEFT = 0x50, KEY_B = 0x05, KEY_W = 0x1A;
    private static final int KEY_F5 = 0x3E, KEY_ESC = 0x29, KEY_HOME = 0x4A, KEY_END = 0x4D;
    private static final int KEY_L = 0x0F, KEY_A = 0x04;
    private static final int MOD_CTRL = 0x01, MOD_SHIFT = 0x02;

    // Sensibilité du laser : pixels du PC par dp glissé, et par radian de rotation du téléphone
    private static final float TOUCH_GAIN = 3f, GYRO_GAIN = 1100f;

    // Descripteur HID : clavier standard, report ID 1
    private static final byte[] DESCRIPTOR = bytes(
            0x05, 0x01, 0x09, 0x06, 0xA1, 0x01, 0x85, 0x01,
            0x05, 0x07, 0x19, 0xE0, 0x29, 0xE7, 0x15, 0x00, 0x25, 0x01, 0x75, 0x01, 0x95, 0x08, 0x81, 0x02,
            0x95, 0x01, 0x75, 0x08, 0x81, 0x01,
            0x95, 0x05, 0x75, 0x01, 0x05, 0x08, 0x19, 0x01, 0x29, 0x05, 0x91, 0x02,
            0x95, 0x01, 0x75, 0x03, 0x91, 0x01,
            0x95, 0x06, 0x75, 0x08, 0x15, 0x00, 0x25, 0x65, 0x05, 0x07, 0x19, 0x00, 0x29, 0x65, 0x81, 0x00,
            0xC0,
            // Souris relative, report ID 2 : 3 boutons, X et Y sur un octet signé
            0x05, 0x01, 0x09, 0x02, 0xA1, 0x01, 0x85, 0x02, 0x09, 0x01, 0xA1, 0x00,
            0x05, 0x09, 0x19, 0x01, 0x29, 0x03, 0x15, 0x00, 0x25, 0x01, 0x95, 0x03, 0x75, 0x01, 0x81, 0x02,
            0x95, 0x01, 0x75, 0x05, 0x81, 0x01,
            0x05, 0x01, 0x09, 0x30, 0x09, 0x31, 0x15, 0x81, 0x25, 0x7F, 0x75, 0x08, 0x95, 0x02, 0x81, 0x06,
            0xC0, 0xC0);

    private static final int REQ_PERMS = 1, REQ_ENABLE = 2, REQ_VISIBLE = 3;

    private final Handler ui = new Handler(Looper.getMainLooper());
    private SharedPreferences prefs;

    // Bluetooth
    private BluetoothAdapter adapter;
    private BluetoothHidDevice hid;
    private BluetoothDevice host;
    private boolean registered;

    // Vues
    private TextView btStatus, hostName, timerView;
    private LinearLayout setupBox, remoteBox, deviceList;

    // Chrono
    private long timerStart = 0, timerElapsed = 0;

    // Laser
    private TextView laserPad;
    private Button aimButton;
    private boolean gyroAim, laserOn;
    private int mouseSent, mouseFailed;
    private float lastX, lastY, restX, restY;
    private long lastGyroNs;
    private SensorManager sensors;
    private final SensorEventListener gyroListener = new SensorEventListener() {
        @Override public void onSensorChanged(SensorEvent e) {
            if (lastGyroNs != 0) {
                float dt = (e.timestamp - lastGyroNs) / 1e9f;
                // Téléphone tenu comme une télécommande : rotation autour de z = gauche/droite, autour de x = haut/bas
                moveMouse(-e.values[2] * dt * GYRO_GAIN, -e.values[0] * dt * GYRO_GAIN);
            }
            lastGyroNs = e.timestamp;
        }
        @Override public void onAccuracyChanged(Sensor s, int a) { }
    };

    // ------------------------------------------------------------------ cycle de vie

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        prefs = getSharedPreferences("pptbt", MODE_PRIVATE);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().setStatusBarColor(BG);
        getWindow().setNavigationBarColor(BG);
        setContentView(buildUi());
        initBluetooth();
        ui.post(tick);
    }

    @Override
    protected void onDestroy() {
        ui.removeCallbacksAndMessages(null);
        stopGyro();
        if (hid != null) {
            try { hid.unregisterApp(); } catch (SecurityException ignored) { }
            adapter.closeProfileProxy(BluetoothProfile.HID_DEVICE, hid);
        }
        super.onDestroy();
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] perms, int[] results) {
        if (code == REQ_PERMS) {
            if (hasBtPermission()) initBluetooth();
            else setStatus("Autorisation Bluetooth refusée", ERR);
        }
    }

    @Override
    protected void onActivityResult(int code, int result, Intent data) {
        if (code == REQ_ENABLE) {
            if (result == RESULT_OK) initBluetooth();
            else setStatus("Le Bluetooth est désactivé", ERR);
        }
    }

    // Touches de volume : volume bas = suivante, volume haut = précédente
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_VOLUME_DOWN || keyCode == KeyEvent.KEYCODE_VOLUME_UP) {
            boolean next = keyCode == KeyEvent.KEYCODE_VOLUME_DOWN;
            if (host != null) {
                if (event.getRepeatCount() == 0) press(next ? KEY_RIGHT : KEY_LEFT);
                return true;
            }
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    public boolean onKeyUp(int keyCode, KeyEvent event) {
        if ((keyCode == KeyEvent.KEYCODE_VOLUME_DOWN || keyCode == KeyEvent.KEYCODE_VOLUME_UP)
                && host != null) {
            return true;
        }
        return super.onKeyUp(keyCode, event);
    }

    // ------------------------------------------------------------------ Bluetooth HID

    private boolean hasBtPermission() {
        if (Build.VERSION.SDK_INT < 31) return true;
        return checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED;
    }

    private void initBluetooth() {
        BluetoothManager bm = getSystemService(BluetoothManager.class);
        adapter = bm == null ? null : bm.getAdapter();
        if (adapter == null) { setStatus("Ce téléphone n'a pas de Bluetooth", ERR); return; }
        if (!hasBtPermission()) {
            requestPermissions(new String[]{
                    Manifest.permission.BLUETOOTH_CONNECT, Manifest.permission.BLUETOOTH_ADVERTISE}, REQ_PERMS);
            return;
        }
        if (!adapter.isEnabled()) {
            startActivityForResult(new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE), REQ_ENABLE);
            return;
        }
        if (hid != null) { refreshDevices(); return; }
        setStatus("Initialisation du clavier Bluetooth…", MUTED);
        boolean ok = adapter.getProfileProxy(this, new BluetoothProfile.ServiceListener() {
            @Override public void onServiceConnected(int profile, BluetoothProfile proxy) {
                hid = (BluetoothHidDevice) proxy;
                register();
            }
            @Override public void onServiceDisconnected(int profile) {
                hid = null; registered = false; host = null;
                updateBtUi();
            }
        }, BluetoothProfile.HID_DEVICE);
        if (!ok) setStatus("Ce téléphone ne prend pas en charge le mode clavier Bluetooth (HID)", ERR);
    }

    private void register() {
        BluetoothHidDeviceAppSdpSettings sdp = new BluetoothHidDeviceAppSdpSettings(
                "Télécommande PPT Bluetooth", "Clavier et souris de présentation", "AMINE AMAHAN",
                BluetoothHidDevice.SUBCLASS1_COMBO, DESCRIPTOR);
        try {
            hid.registerApp(sdp, null, null, getMainExecutor(), new BluetoothHidDevice.Callback() {
                @Override public void onAppStatusChanged(BluetoothDevice plugged, boolean reg) {
                    registered = reg;
                    if (reg) {
                        if (plugged != null) connect(plugged);
                        else autoReconnect();
                    }
                    updateBtUi();
                }
                @Override public void onConnectionStateChanged(BluetoothDevice device, int state) {
                    if (state == BluetoothProfile.STATE_CONNECTED) {
                        host = device;
                        prefs.edit().putString("host", device.getAddress()).apply();
                    } else if (state == BluetoothProfile.STATE_DISCONNECTED && device.equals(host)) {
                        host = null;
                    } else if (state == BluetoothProfile.STATE_CONNECTING) {
                        setStatus("Connexion à " + name(device) + "…", WARN);
                        return;
                    }
                    updateBtUi();
                }
            });
        } catch (SecurityException e) {
            setStatus("Autorisation Bluetooth manquante", ERR);
        }
    }

    private void autoReconnect() {
        String last = prefs.getString("host", null);
        if (last == null) return;
        try {
            for (BluetoothDevice d : adapter.getBondedDevices()) {
                if (d.getAddress().equals(last)) { connect(d); return; }
            }
        } catch (SecurityException ignored) { }
    }

    private void connect(BluetoothDevice device) {
        if (hid == null || !registered) { toast("Clavier Bluetooth pas encore prêt"); return; }
        try {
            setStatus("Connexion à " + name(device) + "…", WARN);
            if (!hid.connect(device)) setStatus("Échec de la connexion à " + name(device), ERR);
        } catch (SecurityException e) {
            setStatus("Autorisation Bluetooth manquante", ERR);
        }
    }

    private void disconnect() {
        if (hid != null && host != null) {
            try { hid.disconnect(host); } catch (SecurityException ignored) { }
        }
        prefs.edit().remove("host").apply();
    }

    private void makeVisible() {
        if (Build.VERSION.SDK_INT >= 31 && checkSelfPermission(Manifest.permission.BLUETOOTH_ADVERTISE)
                != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.BLUETOOTH_ADVERTISE}, REQ_PERMS);
            return;
        }
        Intent i = new Intent(BluetoothAdapter.ACTION_REQUEST_DISCOVERABLE);
        i.putExtra(BluetoothAdapter.EXTRA_DISCOVERABLE_DURATION, 120);
        startActivityForResult(i, REQ_VISIBLE);
    }

    /** Appuie puis relâche une touche. */
    private void press(int key) { press(0, key); }

    // ------------------------------------------------------------------ laser (souris HID)

    private boolean onLaserTouch(MotionEvent e) {
        switch (e.getActionMasked()) {
            case MotionEvent.ACTION_DOWN:
                if (host == null) return false;
                laserOn = true;
                lastX = e.getX(); lastY = e.getY(); restX = 0; restY = 0;
                mouseSent = 0; mouseFailed = 0;
                press(MOD_CTRL, KEY_L); // Ctrl+L : pointeur laser de PowerPoint
                if (gyroAim) startGyro();
                updateLaserPad();
                return true;
            case MotionEvent.ACTION_MOVE:
                if (laserOn && !gyroAim) {
                    float d = getResources().getDisplayMetrics().density;
                    moveMouse((e.getX() - lastX) / d * TOUCH_GAIN, (e.getY() - lastY) / d * TOUCH_GAIN);
                    lastX = e.getX(); lastY = e.getY();
                }
                return true;
            case MotionEvent.ACTION_UP:
            case MotionEvent.ACTION_CANCEL:
                if (laserOn) {
                    laserOn = false;
                    stopGyro();
                    press(MOD_CTRL, KEY_A); // Ctrl+A : retour à la flèche (masquée automatiquement)
                    updateLaserPad();
                }
                return true;
        }
        return false;
    }

    /**
     * Envoie un déplacement relatif (un seul rapport par appel, pour ne pas saturer la file Bluetooth) ;
     * le reste, fractions de pixel comprises, est reporté au suivant.
     */
    private void moveMouse(float dx, float dy) {
        if (hid == null || host == null) return;
        restX += dx; restY += dy;
        int x = (int) Math.max(-127, Math.min(127, restX));
        int y = (int) Math.max(-127, Math.min(127, restY));
        if (x == 0 && y == 0) return;
        restX -= x; restY -= y;
        boolean ok;
        try { ok = hid.sendReport(host, 2, new byte[]{0, (byte) x, (byte) y}); } catch (SecurityException e) { ok = false; }
        if (ok) mouseSent++; else mouseFailed++;
        if ((mouseSent + mouseFailed) % 10 == 1) updateLaserPad();
    }

    /** Fait tracer un carré au curseur du PC, pour vérifier que la souris Bluetooth fonctionne. */
    private void testMouse() {
        if (host == null) { toast("Aucun PC connecté"); return; }
        mouseSent = 0; mouseFailed = 0;
        int[][] dirs = {{12, 0}, {0, 12}, {-12, 0}, {0, -12}};
        for (int i = 0; i < 80; i++) {
            int[] d = dirs[i / 20];
            ui.postDelayed(() -> { restX = 0; restY = 0; moveMouse(d[0], d[1]); }, i * 15L);
        }
        ui.postDelayed(() -> {
            updateLaserPad();
            if (mouseFailed > 0 && mouseSent == 0) {
                setStatus("Le téléphone refuse d'envoyer les mouvements de souris", ERR);
            } else {
                new android.app.AlertDialog.Builder(this)
                        .setTitle("Le curseur du PC a-t-il tracé un carré ?")
                        .setMessage("Si non, Windows utilise encore l'ancienne association (sans souris).\n\n"
                                + "1. Sur le PC : Paramètres › Bluetooth › ce téléphone › Supprimer l'appareil.\n"
                                + "2. Sur le téléphone : Paramètres Bluetooth › le PC › Dissocier.\n"
                                + "3. Dans l'app : « Rendre visible », puis associez à nouveau depuis le PC.")
                        .setPositiveButton("OK", null)
                        .show();
            }
        }, 80 * 15L + 300);
    }

    private void startGyro() {
        if (sensors == null) sensors = getSystemService(SensorManager.class);
        Sensor g = sensors == null ? null : sensors.getDefaultSensor(Sensor.TYPE_GYROSCOPE);
        if (g == null) { toast("Pas de gyroscope : glissez le doigt"); setGyroAim(false); return; }
        lastGyroNs = 0;
        sensors.registerListener(gyroListener, g, SensorManager.SENSOR_DELAY_GAME);
    }

    private void stopGyro() {
        if (sensors != null) sensors.unregisterListener(gyroListener);
    }

    private void setGyroAim(boolean on) {
        gyroAim = on;
        prefs.edit().putBoolean("gyro", on).apply();
        aimButton.setText(on ? "Visée : gyroscope" : "Visée : doigt");
        updateLaserPad();
    }

    private void updateLaserPad() {
        if (laserPad == null) return;
        String info = mouseSent + mouseFailed == 0 ? ""
                : "\n\nmouvements envoyés : " + mouseSent + (mouseFailed > 0 ? " · refusés : " + mouseFailed : "");
        laserPad.setText((laserOn
                ? (gyroAim ? "● Laser actif\nvisez l'écran avec le téléphone" : "● Laser actif\nglissez le doigt")
                : (gyroAim ? "● LASER\nmaintenez et bougez le téléphone" : "● LASER\nmaintenez et glissez le doigt")) + info);
        laserPad.setTextColor(laserOn ? 0xFFFF5A5A : 0xFFFF9A9A);
        laserPad.setBackground(round(laserOn ? 0xFF4A1A1C : 0xFF2A1416, 20));
    }

    private void press(int modifiers, int key) {
        if (hid == null || host == null) { toast("Aucun PC connecté"); return; }
        byte[] down = new byte[8];
        down[0] = (byte) modifiers;
        down[2] = (byte) key;
        try {
            hid.sendReport(host, 1, down);
            ui.postDelayed(() -> {
                try { if (host != null) hid.sendReport(host, 1, new byte[8]); } catch (SecurityException ignored) { }
            }, 40);
        } catch (SecurityException e) {
            toast("Autorisation Bluetooth manquante");
        }
        View v = getWindow().getDecorView();
        v.performHapticFeedback(android.view.HapticFeedbackConstants.KEYBOARD_TAP);
    }

    private String name(BluetoothDevice d) {
        try {
            String n = d.getName();
            return n != null ? n : d.getAddress();
        } catch (SecurityException e) {
            return d.getAddress();
        }
    }

    // ------------------------------------------------------------------ interface

    private View buildUi() {
        LinearLayout root = vbox();
        root.setBackgroundColor(BG);
        root.setPadding(dp(16), dp(12), dp(16), dp(12));
        // Android 15+ affiche l'app sous les barres système : on décale le contenu de leur hauteur
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            int l, t, r, b;
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets bars = insets.getInsets(
                        android.view.WindowInsets.Type.systemBars() | android.view.WindowInsets.Type.ime()
                                | android.view.WindowInsets.Type.displayCutout());
                l = bars.left; t = bars.top; r = bars.right; b = bars.bottom;
            } else {
                l = insets.getSystemWindowInsetLeft(); t = insets.getSystemWindowInsetTop();
                r = insets.getSystemWindowInsetRight(); b = insets.getSystemWindowInsetBottom();
            }
            v.setPadding(dp(16) + l, dp(12) + t, dp(16) + r, dp(12) + b);
            return insets;
        });

        LinearLayout head = hbox();
        head.setGravity(Gravity.CENTER_VERTICAL);
        TextView title = text("Télécommande PPT", 20, TEXT);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        head.addView(title);
        TextView badge = text("Bluetooth", 12, 0xFFFFFFFF);
        badge.setTypeface(Typeface.DEFAULT_BOLD);
        badge.setPadding(dp(10), dp(3), dp(10), dp(3));
        badge.setBackground(round(BLUE, 99));
        LinearLayout.LayoutParams blp = new LinearLayout.LayoutParams(wrap(), wrap());
        blp.setMargins(dp(10), 0, 0, 0);
        head.addView(badge, blp);
        root.addView(head);
        TextView credit = text("Réalisé par : AMINE AMAHAN", 13, ACCENT);
        credit.setTypeface(Typeface.DEFAULT_BOLD);
        root.addView(credit);

        TextView note = text("Fonctionne sans Wi-Fi et sans rien installer sur le PC.", 13, MUTED);
        note.setPadding(0, dp(4), 0, dp(12));
        root.addView(note);
        root.addView(buildBtPanel(), vweight(1));
        return root;
    }

    private View buildBtPanel() {
        LinearLayout p = vbox();

        btStatus = text("", 15, MUTED);
        btStatus.setPadding(dp(14), dp(10), dp(14), dp(10));
        btStatus.setBackground(round(PANEL, 16));
        p.addView(btStatus, margins(match(), wrap(), 0, 0, 0, dp(12)));

        // Configuration : association et liste des PC
        setupBox = vbox();
        TextView help = text(
                "1. Appuyez sur « Rendre visible ».\n" +
                "2. Sur le PC : Paramètres › Bluetooth › Ajouter un appareil, puis choisissez ce téléphone.\n" +
                "3. Une fois associé, le PC apparaît ci-dessous : touchez-le pour vous connecter.\n\n" +
                "Si le PC était déjà associé à ce téléphone avant, supprimez l'association des deux côtés puis associez-les à nouveau.",
                14, MUTED);
        setupBox.addView(help, margins(match(), wrap(), 0, 0, 0, dp(12)));
        LinearLayout row = hbox();
        row.addView(button("Rendre visible", ACCENT, v -> makeVisible()), weight(1, dp(48)));
        row.addView(space(dp(8), 1));
        row.addView(button("Actualiser", PANEL2, v -> { initBluetooth(); refreshDevices(); }), weight(1, dp(48)));
        setupBox.addView(row, new LinearLayout.LayoutParams(match(), dp(48)));
        TextView lbl = text("APPAREILS ASSOCIÉS", 12, MUTED);
        lbl.setPadding(0, dp(16), 0, dp(8));
        setupBox.addView(lbl);
        deviceList = vbox();
        ScrollView sv = new ScrollView(this);
        sv.addView(deviceList);
        setupBox.addView(sv, vweight(1));
        p.addView(setupBox, vweight(1));

        // Télécommande
        remoteBox = vbox();
        LinearLayout top = hbox();
        top.setGravity(Gravity.CENTER_VERTICAL);
        hostName = text("", 16, TEXT);
        hostName.setTypeface(Typeface.DEFAULT_BOLD);
        top.addView(hostName, weight(1, wrap()));
        top.addView(button("Déconnecter", 0xFF3A2226, v -> disconnect()), new LinearLayout.LayoutParams(wrap(), dp(40)));
        remoteBox.addView(top, margins(match(), wrap(), 0, 0, 0, dp(12)));

        HorizontalScrollView hs = new HorizontalScrollView(this);
        hs.setHorizontalScrollBarEnabled(false);
        LinearLayout tools = hbox();
        tools.addView(tool("▶ Lancer", ACCENT, v -> { press(KEY_F5); startTimerIfIdle(); }));
        tools.addView(tool("▶ Depuis ici", PANEL2, v -> { press(MOD_SHIFT, KEY_F5); startTimerIfIdle(); }));
        tools.addView(tool("■ Terminer", 0xFF3A2226, v -> press(KEY_ESC)));
        tools.addView(tool("Écran noir", PANEL2, v -> press(KEY_B)));
        tools.addView(tool("Écran blanc", PANEL2, v -> press(KEY_W)));
        tools.addView(tool("⏮ Début", PANEL2, v -> press(KEY_HOME)));
        tools.addView(tool("⏭ Fin", PANEL2, v -> press(KEY_END)));
        tools.addView(tool("🖱 Tester la souris", PANEL2, v -> testMouse()));
        hs.addView(tools);
        remoteBox.addView(hs, margins(match(), dp(48), 0, 0, 0, dp(12)));

        // Chrono et choix du mode de visée du laser
        LinearLayout row2 = hbox();
        timerView = text("00:00", 34, TEXT);
        timerView.setTypeface(Typeface.create(Typeface.MONOSPACE, Typeface.BOLD));
        timerView.setGravity(Gravity.CENTER);
        timerView.setBackground(round(PANEL, 16));
        timerView.setOnClickListener(v -> toggleTimer());
        timerView.setOnLongClickListener(v -> { timerStart = 0; timerElapsed = 0; updateTimer(); return true; });
        row2.addView(timerView, weight(1, match()));
        row2.addView(space(dp(10), 1));
        aimButton = button("", PANEL2, v -> setGyroAim(!gyroAim));
        aimButton.setTextSize(14);
        row2.addView(aimButton, weight(1, match()));
        remoteBox.addView(row2, margins(match(), dp(64), 0, 0, 0, dp(12)));
        setGyroAim(prefs.getBoolean("gyro", false));

        // Zone laser : maintenir pour afficher le laser de PowerPoint
        laserPad = text("", 16, TEXT);
        laserPad.setGravity(Gravity.CENTER);
        laserPad.setBackground(round(0xFF2A1416, 20));
        laserPad.setOnTouchListener((v, e) -> onLaserTouch(e));
        remoteBox.addView(laserPad, vweight(1));
        updateLaserPad();
        TextView hint = text("Chrono : appui = démarrer/pause, appui long = zéro · Volume − / + = suivante / précédente", 12, MUTED);
        hint.setGravity(Gravity.CENTER);
        hint.setPadding(0, dp(8), 0, dp(12));
        remoteBox.addView(hint);

        LinearLayout nav = hbox();
        Button prev = button("‹", PANEL2, v -> press(KEY_LEFT));
        Button next = button("›", ACCENT, v -> press(KEY_RIGHT));
        prev.setTextSize(56);
        next.setTextSize(56);
        nav.addView(prev, weight(1, match()));
        nav.addView(space(dp(12), 1));
        nav.addView(next, weight(2, match()));
        remoteBox.addView(nav, new LinearLayout.LayoutParams(match(), dp(170)));
        remoteBox.setVisibility(View.GONE);
        p.addView(remoteBox, vweight(1));
        return p;
    }

    private void updateBtUi() {
        boolean connected = host != null;
        setupBox.setVisibility(connected ? View.GONE : View.VISIBLE);
        remoteBox.setVisibility(connected ? View.VISIBLE : View.GONE);
        if (connected) {
            hostName.setText("🖥 " + name(host));
            setStatus("● Connecté — PowerPoint doit être au premier plan sur le PC", OK);
        } else if (registered) {
            setStatus("Clavier Bluetooth prêt — associez ou choisissez un PC", MUTED);
        } else if (hid != null) {
            setStatus("Enregistrement du clavier Bluetooth…", MUTED);
        }
        refreshDevices();
    }

    private void refreshDevices() {
        if (deviceList == null) return;
        deviceList.removeAllViews();
        if (adapter == null || !hasBtPermission()) return;
        Set<BluetoothDevice> bonded;
        try { bonded = adapter.getBondedDevices(); } catch (SecurityException e) { return; }
        List<BluetoothDevice> sorted = new ArrayList<>();
        for (BluetoothDevice d : bonded) {
            BluetoothClass c = d.getBluetoothClass();
            boolean computer = c != null && c.getMajorDeviceClass() == BluetoothClass.Device.Major.COMPUTER;
            if (computer) sorted.add(0, d); else sorted.add(d);
        }
        if (sorted.isEmpty()) {
            deviceList.addView(text("Aucun appareil associé pour l'instant.", 14, MUTED));
            return;
        }
        for (BluetoothDevice d : sorted) {
            BluetoothClass c = d.getBluetoothClass();
            boolean computer = c != null && c.getMajorDeviceClass() == BluetoothClass.Device.Major.COMPUTER;
            Button b = button((computer ? "🖥  " : "📶  ") + name(d), PANEL, v -> connect(d));
            b.setGravity(Gravity.CENTER_VERTICAL | Gravity.START);
            b.setPadding(dp(16), 0, dp(16), 0);
            deviceList.addView(b, margins(match(), dp(52), 0, 0, 0, dp(8)));
        }
    }

    private void setStatus(String s, int color) {
        btStatus.setText(s);
        btStatus.setTextColor(color);
    }

    // ------------------------------------------------------------------ chrono

    private final Runnable tick = new Runnable() {
        @Override public void run() { updateTimer(); ui.postDelayed(this, 500); }
    };

    private void toggleTimer() {
        if (timerStart != 0) { timerElapsed += SystemClock.elapsedRealtime() - timerStart; timerStart = 0; }
        else timerStart = SystemClock.elapsedRealtime();
        updateTimer();
    }

    private void startTimerIfIdle() { if (timerStart == 0 && timerElapsed == 0) toggleTimer(); }

    private void updateTimer() {
        if (timerView == null) return;
        long ms = timerElapsed + (timerStart != 0 ? SystemClock.elapsedRealtime() - timerStart : 0);
        long s = ms / 1000, h = s / 3600, m = (s / 60) % 60, sec = s % 60;
        timerView.setText(h > 0 ? String.format("%d:%02d:%02d", h, m, sec) : String.format("%02d:%02d", m, sec));
        timerView.setTextColor(timerStart != 0 ? OK : TEXT);
    }

    // ------------------------------------------------------------------ utilitaires

    private static byte[] bytes(int... v) {
        byte[] b = new byte[v.length];
        for (int i = 0; i < v.length; i++) b[i] = (byte) v[i];
        return b;
    }

    private int dp(float v) { return Math.round(v * getResources().getDisplayMetrics().density); }
    private static int match() { return ViewGroup.LayoutParams.MATCH_PARENT; }
    private static int wrap() { return ViewGroup.LayoutParams.WRAP_CONTENT; }

    private LinearLayout vbox() { LinearLayout l = new LinearLayout(this); l.setOrientation(LinearLayout.VERTICAL); return l; }
    private LinearLayout hbox() { LinearLayout l = new LinearLayout(this); l.setOrientation(LinearLayout.HORIZONTAL); return l; }

    private View space(int w, int h) { View v = new View(this); v.setLayoutParams(new LinearLayout.LayoutParams(w, h)); return v; }

    private LinearLayout.LayoutParams weight(float w, int height) {
        return new LinearLayout.LayoutParams(0, height, w);
    }

    private LinearLayout.LayoutParams vweight(float w) {
        return new LinearLayout.LayoutParams(match(), 0, w);
    }

    private LinearLayout.LayoutParams margins(int w, int h, int l, int t, int r, int b) {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(w, h);
        lp.setMargins(l, t, r, b);
        return lp;
    }

    private GradientDrawable round(int color, int radiusDp) {
        GradientDrawable g = new GradientDrawable();
        g.setColor(color);
        g.setCornerRadius(dp(radiusDp));
        return g;
    }

    private TextView text(String s, float sp, int color) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(sp);
        t.setTextColor(color);
        return t;
    }

    private Button button(String label, int color, View.OnClickListener l) {
        Button b = new Button(this);
        b.setText(label);
        b.setAllCaps(false);
        b.setTextColor(TEXT);
        b.setTextSize(16);
        b.setBackground(round(color, 12));
        b.setStateListAnimator(null);
        b.setOnClickListener(l);
        return b;
    }

    private Button tool(String label, int color, View.OnClickListener l) {
        Button b = button(label, color, l);
        b.setTextSize(14);
        b.setPadding(dp(14), 0, dp(14), 0);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(wrap(), dp(48));
        lp.setMargins(0, 0, dp(8), 0);
        b.setLayoutParams(lp);
        return b;
    }

    private void toast(String s) { Toast.makeText(this, s, Toast.LENGTH_SHORT).show(); }
}
