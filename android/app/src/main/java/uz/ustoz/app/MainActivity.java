package uz.ustoz.app;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.view.Gravity;

public class MainActivity extends Activity {
    private WebView web;
    private View offline;
    private final String home = BuildConfig.SITE_URL;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.parseColor("#1c41b4"));

        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, true);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri uri = req.getUrl();
                Uri base = Uri.parse(home);
                if (uri.getHost() != null && uri.getHost().equals(base.getHost())) return false;
                // tel:, mailto: va tashqi saytlar telefonning o'z ilovalarida ochiladi
                try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (Exception ignored) {}
                return true;
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest req, WebResourceError err) {
                if (req.isForMainFrame()) showOffline(true);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                CookieManager.getInstance().flush();
            }
        });

        offline = buildOfflineView();
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.addView(web, new LinearLayout.LayoutParams(-1, -1));
        root.addView(offline, new LinearLayout.LayoutParams(-1, -1));
        setContentView(root);
        showOffline(false);

        if (state != null) web.restoreState(state);
        else web.loadUrl(home);
    }

    private View buildOfflineView() {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER);
        box.setPadding(64, 64, 64, 64);
        TextView t = new TextView(this);
        t.setText("Internet aloqasi yo'q.\nUlanishni tekshirib, qayta urinib ko'ring.");
        t.setGravity(Gravity.CENTER);
        t.setTextSize(18);
        Button b = new Button(this);
        b.setText("Qayta urinish");
        b.setOnClickListener(v -> { showOffline(false); web.reload(); });
        box.addView(t);
        box.addView(b);
        return box;
    }

    private void showOffline(boolean on) {
        offline.setVisibility(on ? View.VISIBLE : View.GONE);
        web.setVisibility(on ? View.GONE : View.VISIBLE);
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }
}
