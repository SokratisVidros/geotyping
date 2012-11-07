<%@ page import="java.io.*, java.net.*"%>
<%
    // Enter the URL of the geoparser here
    String address = "http://<SERVER_URL>/process.jsp";
    StringBuffer reply = new StringBuffer();

    try {    
    	String encodedParameters = URLEncoder.encode(request.getParameter("sentence"),"UTF-8");
        System.err.println(request.getParameter("sentence"));

	URL url = new URL(address);
        URLConnection conn = url.openConnection();
        conn.setDoOutput(true);

        OutputStreamWriter writer = new OutputStreamWriter(conn.getOutputStream());
        
        writer.write(encodedParameters);
        writer.flush();
        
        BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream(),"UTF8"));
        String inputLine;
        
	while ( (inputLine = reader.readLine()) != null) {
        	reply.append(inputLine);
			System.err.println("Response: " + inputLine);
	}
        writer.close();
        reader.close();
    } 
    catch (MalformedURLException e) {
    	out.println(e.getMessage());
    } catch (IOException e) {
    	out.println(e.getMessage());
    }
%><%= reply.toString() %>

