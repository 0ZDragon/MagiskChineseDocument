import{_ as e,c as t,o,d as i}from"./app.f353d06f.js";const u=JSON.parse('{"title":"Android Booting Shenanigans","description":"","frontmatter":{},"headers":[{"level":2,"title":"Terminologies","slug":"terminologies","link":"#terminologies","children":[]},{"level":2,"title":"Boot Methods","slug":"boot-methods","link":"#boot-methods","children":[{"level":3,"title":"Discussion","slug":"discussion","link":"#discussion","children":[]}]},{"level":2,"title":"Some History","slug":"some-history","link":"#some-history","children":[]},{"level":2,"title":"Piecing Things Together","slug":"piecing-things-together","link":"#piecing-things-together","children":[]}],"relativePath":"boot.md"}'),n={name:"boot.md"},r=i('<h1 id="android-booting-shenanigans" tabindex="-1">Android Booting Shenanigans <a class="header-anchor" href="#android-booting-shenanigans" aria-hidden="true">#</a></h1><h2 id="terminologies" tabindex="-1">Terminologies <a class="header-anchor" href="#terminologies" aria-hidden="true">#</a></h2><ul><li><strong>rootdir</strong>: the root directory (<code>/</code>). All files/folders/filesystems are stored in or mounted under rootdir. On Android, the filesystem may be either <code>rootfs</code> or the <code>system</code> partition.</li><li><strong><code>initramfs</code></strong>: a section in Android&#39;s boot image that the Linux kernel will use as <code>rootfs</code>. People also use the term <strong>ramdisk</strong> interchangeably</li><li><strong><code>recovery</code> and <code>boot</code> partition</strong>: these 2 are actually very similar: both are Android boot images containing ramdisk and Linux kernel (plus some other stuff). The only difference is that booting <code>boot</code> partition will bring us to Android, while <code>recovery</code> has a minimalist self contained Linux environment for repairing and upgrading the device.</li><li><strong>SAR</strong>: System-as-root. That is, the device uses <code>system</code> as rootdir instead of <code>rootfs</code></li><li><strong>A/B, A-only</strong>: For devices supporting <a href="https://source.android.com/devices/tech/ota/ab" target="_blank" rel="noreferrer">Seamless System Updates</a>, it will have 2 slots of all read-only partitions; we call these <strong>A/B devices</strong>. To differentiate, non A/B devices will be called <strong>A-only</strong></li><li><strong>2SI</strong>: Two Stage Init. The way Android 10+ boots. More info later.</li></ul><p>Here are a few parameters to more precisely define a device&#39;s Android version:</p><ul><li><strong>LV</strong>: Launch Version. The Android version the device is <strong>launched</strong> with. That is, the Android version pre-installed when the device first hit the market.</li><li><strong>RV</strong>: Running Version. The Android version the device is currently running on.</li></ul><p>We will use <strong>Android API level</strong> to represent LV and RV. The mapping between API level and Android versions can be seen in <a href="https://source.android.com/setup/start/build-numbers#platform-code-names-versions-api-levels-and-ndk-releases" target="_blank" rel="noreferrer">this table</a>. For example: Pixel XL is released with Android 7.1, and is running Android 10, these parameters will be <code>(LV = 25, RV = 29)</code></p><h2 id="boot-methods" tabindex="-1">Boot Methods <a class="header-anchor" href="#boot-methods" aria-hidden="true">#</a></h2><p>Android booting can be roughly categorized into 3 major different methods. We provide a general rule of thumb to determine which method your device is most likely using, with exceptions listed separately.</p><table><thead><tr><th style="text-align:center;">Method</th><th>Initial rootdir</th><th>Final rootdir</th></tr></thead><tbody><tr><td style="text-align:center;"><strong>A</strong></td><td><code>rootfs</code></td><td><code>rootfs</code></td></tr><tr><td style="text-align:center;"><strong>B</strong></td><td><code>system</code></td><td><code>system</code></td></tr><tr><td style="text-align:center;"><strong>C</strong></td><td><code>rootfs</code></td><td><code>system</code></td></tr></tbody></table><ul><li><strong>Method A - Legacy ramdisk</strong>: This is how <em>all</em> Android devices used to boot (good old days). The kernel uses <code>initramfs</code> as rootdir, and exec <code>/init</code> to boot. <ul><li>Devices that does not fall in any of Method B and C&#39;s criteria</li></ul></li><li><strong>Method B - Legacy SAR</strong>: This method was first seen on Pixel 1. The kernel directly mounts the <code>system</code> partition as rootdir and exec <code>/init</code> to boot. <ul><li>Devices with <code>(LV = 28)</code></li><li>Google: Pixel 1 and 2. Pixel 3 and 3a when <code>(RV = 28)</code>.</li><li>OnePlus: 6 - 7</li><li>Maybe some <code>(LV &lt; 29)</code> Android Go devices?</li></ul></li><li><strong>Method C - 2SI ramdisk SAR</strong>: This method was first seen on Pixel 3 Android 10 developer preview. The kernel uses <code>initramfs</code> as rootdir and exec <code>/init</code> in <code>rootfs</code>. This <code>init</code> is responsible to mount the <code>system</code> partition and use it as the new rootdir, then finally exec <code>/system/bin/init</code> to boot. <ul><li>Devices with <code>(LV &gt;= 29)</code></li><li>Devices with <code>(LV &lt; 28, RV &gt;= 29)</code>, excluding those that were already using Method B</li><li>Google: Pixel 3 and 3a with <code>(RV &gt;= 29)</code></li></ul></li></ul><h3 id="discussion" tabindex="-1">Discussion <a class="header-anchor" href="#discussion" aria-hidden="true">#</a></h3><p>From documents online, Google&#39;s definition of SAR only considers how the kernel boots the device (<strong>Initial rootdir</strong> in the table above), meaning that only devices using <strong>Method B</strong> is <em>officially</em> considered an SAR device from Google&#39;s standpoint.</p><p>However for Magisk, the real difference lies in what the device ends up using when fully booted (<strong>Final rootdir</strong> in the table above), meaning that <strong>as far as Magisk&#39;s concern, both Method B and C is a form of SAR</strong>, but just implemented differently. Every instance of SAR later mentioned in this document will refer to <strong>Magisk&#39;s definition</strong> unless specifically says otherwise.</p><p>The criteria for Method C is a little complicated, in layman&#39;s words: either your device is modern enough to launch with Android 10+, or you are running an Android 10+ custom ROM on a device that was using Method A.</p><ul><li>Any Method A device running Android 10+ will automatically be using Method C</li><li><strong>Method B devices are stuck with Method B</strong>, with the only exception being Pixel 3 and 3a, which Google retrofitted the device to adapt the new method.</li></ul><p>SAR is a very important part of <a href="https://source.android.com/devices/architecture#hidl" target="_blank" rel="noreferrer">Project Treble</a> as rootdir should be tied to the platform. This is also the reason why Method B and C comes with <code>(LV &gt;= ver)</code> criterion as Google has enforced all OEMs to comply with updated requirements every year.</p><h2 id="some-history" tabindex="-1">Some History <a class="header-anchor" href="#some-history" aria-hidden="true">#</a></h2><p>When Google released the first generation Pixel, it also introduced <a href="https://source.android.com/devices/tech/ota/ab" target="_blank" rel="noreferrer">A/B (Seamless) System Updates</a>. Due to <a href="https://source.android.com/devices/tech/ota/ab/ab_faqs" target="_blank" rel="noreferrer">storage size concerns</a>, there are several differences compared to A-only, the most relevant one being the removal of <code>recovery</code> partition and the recovery ramdisk being merged into <code>boot</code>.</p><p>Let&#39;s go back in time when Google is first designing A/B. If using SAR (only Boot Method B exists at that time), the kernel doesn&#39;t need <code>initramfs</code> to boot Android (because rootdir is in <code>system</code>). This mean we can be smart and just stuff the recovery ramdisk (containing the minimalist Linux environment) into <code>boot</code>, remove <code>recovery</code>, and let the kernel pick whichever rootdir to use (ramdisk or <code>system</code>) based on information from the bootloader.</p><p>As time passed from Android 7.1 to Android 10, Google introduced <a href="https://source.android.com/devices/tech/ota/dynamic_partitions/implement" target="_blank" rel="noreferrer">Dynamic Partitions</a>. This is bad news for SAR, because the Linux kernel cannot directly understand this new partition format, thus unable to directly mount <code>system</code> as rootdir. This is when they came up with Boot Method C: always boot into <code>initramfs</code>, and let userspace handle the rest of booting. This includes deciding whether to boot into Android or recovery, or as they officially call: <code>USES_RECOVERY_AS_BOOT</code>.</p><p>Some modern devices using A/B with 2SI also comes with <code>recovery_a/_b</code> partitions. This is officially supported with Google&#39;s standard. These devices will then only use the boot ramdisk to boot into Android as recovery is stored on a separate partition.</p><h2 id="piecing-things-together" tabindex="-1">Piecing Things Together <a class="header-anchor" href="#piecing-things-together" aria-hidden="true">#</a></h2><p>With all the knowledge above, now we can categorize all Android devices into these different types:</p><table><thead><tr><th style="text-align:center;">Type</th><th style="text-align:center;">Boot Method</th><th style="text-align:center;">Partition</th><th style="text-align:center;">2SI</th><th style="text-align:center;">Ramdisk in <code>boot</code></th></tr></thead><tbody><tr><td style="text-align:center;"><strong>I</strong></td><td style="text-align:center;">A</td><td style="text-align:center;">A-only</td><td style="text-align:center;">No</td><td style="text-align:center;"><code>boot</code> ramdisk</td></tr><tr><td style="text-align:center;"><strong>II</strong></td><td style="text-align:center;">B</td><td style="text-align:center;">A/B</td><td style="text-align:center;">Any</td><td style="text-align:center;"><code>recovery</code> ramdisk</td></tr><tr><td style="text-align:center;"><strong>III</strong></td><td style="text-align:center;">B</td><td style="text-align:center;">A-only</td><td style="text-align:center;">Any</td><td style="text-align:center;"><em><strong>N/A</strong></em></td></tr><tr><td style="text-align:center;"><strong>IV</strong></td><td style="text-align:center;">C</td><td style="text-align:center;">Any</td><td style="text-align:center;">Yes</td><td style="text-align:center;">Hybrid ramdisk</td></tr></tbody></table><p>These types are ordered chronologically by the time they were first available.</p><ul><li><strong>Type I</strong>: Good old legacy ramdisk boot</li><li><strong>Type II</strong>: Legacy A/B devices. Pixel 1 is the first device of this type, being both the first A/B and SAR device</li><li><strong>Type III</strong>: Late 2018 - 2019 devices that are A-only. <strong>The worst type of device to ever exist as far as Magisk is concerned.</strong></li><li><strong>Type IV</strong>: All devices using Boot Method C are Type IV. A/B Type IV ramdisk can boot into either Android or recovery based on info from bootloader; A-only Type IV ramdisk can only boot into Android.</li></ul><p>Further details on Type III devices: Magisk is always installed in the ramdisk of a boot image. For all other device types, because their <code>boot</code> partition have ramdisk included, Magisk can be easily installed by patching boot image through the Magisk app or flash zip in custom recovery. However for Type III devices, they are <strong>limited to install Magisk into the <code>recovery</code> partition</strong>. Magisk will not function when booted normally; instead Type III device owners have to always reboot to recovery to maintain Magisk access.</p><p>Some Type III devices&#39; bootloader will still accept and provide <code>initramfs</code> that was manually added to the <code>boot</code> image to the kernel (e.g. some Xiaomi phones), but many device don&#39;t (e.g. Samsung S10, Note 10). It solely depends on how the OEM implements its bootloader.</p>',28),s=[r];function d(a,l,c,h,g,m){return o(),t("div",null,s)}const p=e(n,[["render",d]]);export{u as __pageData,p as default};