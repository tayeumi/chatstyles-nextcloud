# chatstyles-nextcloud

1.custom: chuyển hướng URL external link: mục đích chuyển link thân thiện với module truyền thông nội bộ: /news/ - edit tại file js của project này

# custom khác:

1. custom trực tiếp hiển thị dashboard dùng iframe widget và ép luôn hiển thị tại app gốc : apps/dashboard/lib/service/DashboardService.php:

```bash

public function getLayout(): array {
    // layout goc
    //$systemDefault = $this->config->getAppValue('dashboard', 'layout', 'group-iframewidget,recommendations,spreed,mail,calendar');
            //return array_values(array_filter(explode(',', $this->config->getUserValue($this->userId, 'dashboard', 'layout', $systemDefault)), fn (string $value) => $value !== ''));
    // Anhpt2 custom em buộc hiển thị group-iframewidget trên layouy
    $systemDefault = $this->config->getAppValue(
    'dashboard',
    'layout',
    'group-iframewidget,recommendations,spreed,mail,calendar'
    );

            $layoutRaw = $this->config->getUserValue(
                $this->userId,
                'dashboard',
                'layout',
                $systemDefault
            );

            // chuyển chuỗi → list widget id
            $widgets = array_values(
                array_filter(
                    explode(',', $layoutRaw),
                    fn(string $value) => $value !== ''
                )
            );

            // ÉP group-iframewidget tồn tại
            if (!in_array('group-iframewidget', $widgets)) {
                array_unshift($widgets, 'group-iframewidget');
                // hoặc array_push nếu muốn xuống cuối
            }
            return $widgets;
    }
```

2. Tang cau hinh worker php:

```bash
apt-get update
apt-get install -y nano
nano /etc/apache2/mods-enabled/mpm_prefork.conf
```

StartServers 10
MinSpareServers 10
MaxSpareServers 20
ServerLimit 500
MaxRequestWorkers 500
MaxConnectionsPerChild 2000

- Kiem tra:

```bash
grep -i "MaxRequestWorkers" /etc/apache2/mods-available/mpm_prefork.conf
grep -i "ServerLimit" /etc/apache2/mods-available/mpm_prefork.conf
```

- xem realtime session :

```bash
watch -n1 'ps -C apache2 --no-headers | wc -l'	 // monitor worker apache realtime
```
