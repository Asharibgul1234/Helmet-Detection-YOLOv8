import javax.swing.*;
import java.awt.*;
import java.awt.event.*;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.Files;

public class HelmetDetectionApp extends JFrame {
    private JLabel imageLabel;
    private JLabel videoLabel;
    private JLabel liveLabel;
    private JButton closeImageBtn;
    private JButton closeVideoBtn;
    private JButton closeLiveBtn;

    private static final String BASE_URL = "http://localhost:5000";

    public HelmetDetectionApp() {
        setTitle("Helmet Detection System - YOLOv8");
        setSize(800, 700);
        setDefaultCloseOperation(EXIT_ON_CLOSE);
        setLayout(new FlowLayout());

        // Image Detection
        JButton uploadImageBtn = new JButton("Upload Image");
        uploadImageBtn.addActionListener(e -> uploadImage());
        imageLabel = new JLabel();
        closeImageBtn = new JButton("×");
        closeImageBtn.addActionListener(e -> {
            imageLabel.setIcon(null);
            closeImageBtn.setVisible(false);
        });
        closeImageBtn.setVisible(false);

        // Video Detection
        JButton uploadVideoBtn = new JButton("Upload Video");
        uploadVideoBtn.addActionListener(e -> uploadVideo());
        videoLabel = new JLabel();
        closeVideoBtn = new JButton("×");
        closeVideoBtn.addActionListener(e -> {
            videoLabel.setText("");
            closeVideoBtn.setVisible(false);
        });
        closeVideoBtn.setVisible(false);

        // Live Camera
        JButton startLiveBtn = new JButton("Start Live");
        startLiveBtn.addActionListener(e -> startLive());
        JButton stopLiveBtn = new JButton("Stop Live");
        stopLiveBtn.addActionListener(e -> stopLive());
        liveLabel = new JLabel();
        closeLiveBtn = new JButton("×");
        closeLiveBtn.addActionListener(e -> {
            stopLive();
            liveLabel.setText("");
            closeLiveBtn.setVisible(false);
        });
        closeLiveBtn.setVisible(false);

        // Delete All
        JButton deleteAllBtn = new JButton("Delete All Files");
        deleteAllBtn.addActionListener(e -> deleteAllFiles());

        add(uploadImageBtn);
        add(closeImageBtn);
        add(imageLabel);
        add(uploadVideoBtn);
        add(closeVideoBtn);
        add(videoLabel);
        add(startLiveBtn);
        add(stopLiveBtn);
        add(closeLiveBtn);
        add(liveLabel);
        add(deleteAllBtn);

        setVisible(true);
    }

    private void uploadImage() {
        JFileChooser chooser = new JFileChooser();
        int returnVal = chooser.showOpenDialog(this);
        if (returnVal != JFileChooser.APPROVE_OPTION) return;

        File file = chooser.getSelectedFile();
        try {
            byte[] response = postFile(BASE_URL + "/upload_image", file);
            ImageIcon icon = new ImageIcon(response);
            imageLabel.setIcon(icon);
            closeImageBtn.setVisible(true);
        } catch (Exception e) {
            e.printStackTrace();
            JOptionPane.showMessageDialog(this, "Image upload failed");
        }
    }

    private void uploadVideo() {
        JFileChooser chooser = new JFileChooser();
        int returnVal = chooser.showOpenDialog(this);
        if (returnVal != JFileChooser.APPROVE_OPTION) return;

        File file = chooser.getSelectedFile();
        try {
            byte[] response = postFile(BASE_URL + "/upload_video", file);
            File outFile = new File("processed_video.mp4");
            Files.write(outFile.toPath(), response);
            videoLabel.setText("Video saved: " + outFile.getAbsolutePath());
            closeVideoBtn.setVisible(true);
        } catch (Exception e) {
            e.printStackTrace();
            JOptionPane.showMessageDialog(this, "Video upload failed");
        }
    }

    private void startLive() {
        try {
            HttpURLConnection con = (HttpURLConnection) new URL(BASE_URL + "/start_live").openConnection();
            con.setRequestMethod("POST");
            con.setDoOutput(true);
            con.getOutputStream().write("{\"device\":0}".getBytes());
            con.getInputStream().close();

            liveLabel.setText("Live feed started. Open browser to view.");
            closeLiveBtn.setVisible(true);
        } catch (Exception e) {
            e.printStackTrace();
            JOptionPane.showMessageDialog(this, "Live start failed");
        }
    }

    private void stopLive() {
        try {
            HttpURLConnection con = (HttpURLConnection) new URL(BASE_URL + "/stop_live").openConnection();
            con.setRequestMethod("POST");
            con.getInputStream().close();
            liveLabel.setText("Live feed stopped");
        } catch (Exception e) {
            e.printStackTrace();
            JOptionPane.showMessageDialog(this, "Live stop failed");
        }
    }

    private void deleteAllFiles() {
        try {
            HttpURLConnection con = (HttpURLConnection) new URL(BASE_URL + "/delete_all").openConnection();
            con.setRequestMethod("POST");
            InputStream in = con.getInputStream();
            in.close();
            JOptionPane.showMessageDialog(this, "All files deleted!");
        } catch (Exception e) {
            e.printStackTrace();
            JOptionPane.showMessageDialog(this, "Delete all failed");
        }
    }

    private byte[] postFile(String urlString, File file) throws IOException {
        String boundary = Long.toHexString(System.currentTimeMillis());
        HttpURLConnection connection = (HttpURLConnection) new URL(urlString).openConnection();
        connection.setDoOutput(true);
        connection.setRequestMethod("POST");
        connection.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);

        OutputStream output = connection.getOutputStream();
        PrintWriter writer = new PrintWriter(new OutputStreamWriter(output, "UTF-8"), true);

        // Send file
        writer.append("--").append(boundary).append("\r\n");
        writer.append("Content-Disposition: form-data; name=\"file\"; filename=\"").append(file.getName()).append("\"\r\n");
        writer.append("Content-Type: application/octet-stream\r\n\r\n").flush();
        Files.copy(file.toPath(), output);
        output.flush();
        writer.append("\r\n").flush();

        writer.append("--").append(boundary).append("--\r\n").flush();
        writer.close();

        InputStream in = connection.getInputStream();
        byte[] response = in.readAllBytes();
        in.close();
        return response;
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(HelmetDetectionApp::new);
    }
}
